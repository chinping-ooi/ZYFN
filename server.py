"""Local ZYFN preview. Read HLB directly from Transaction.xlsx on each request."""
from datetime import date, timedelta
from decimal import Decimal
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
import json
import re
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parent
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}


def read_hlb(workbook_path):
    with zipfile.ZipFile(workbook_path) as archive:
        strings = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            tree = ET.fromstring(archive.read('xl/sharedStrings.xml'))
            strings = [''.join(item.itertext()) for item in tree]
        workbook = ET.fromstring(archive.read('xl/workbook.xml'))
        sheets = workbook.find('m:sheets', NS)
        sheet = next((item for item in sheets if item.attrib['name'].lower() == 'hlb'), None)
        if sheet is None:
            raise ValueError('HLB sheet was not found in Transaction.xlsx.')
        relationships = ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))
        paths = {item.attrib['Id']: item.attrib['Target'] for item in relationships}
        relationship = sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']
        target = paths[relationship].lstrip('/')
        target = target if target.startswith('xl/') else 'xl/' + target
        tree = ET.fromstring(archive.read(target))
        source_rows = tree.findall('m:sheetData/m:row', NS)
        parsed = []
        for row in source_rows:
            values = {}
            for cell in row:
                column = re.sub(r'\d', '', cell.attrib['r'])
                value_node = cell.find('m:v', NS)
                value = value_node.text if value_node is not None else None
                kind = cell.attrib.get('t')
                if kind == 's' and value is not None:
                    value = strings[int(value)]
                elif kind == 'inlineStr':
                    value = ''.join(cell.find('m:is', NS).itertext())
                values[column] = value
            if any(value not in (None, '') for value in values.values()):
                parsed.append((int(row.attrib['r']), values))
        header = parsed[0][1]
        columns = {str(value).strip().lower(): column for column, value in header.items()}
        required = ['date', 'description', 'debit', 'credit', 'balance']
        if any(name not in columns for name in required):
            raise ValueError('HLB requires Date, Description, Debit, Credit, and Balance headers.')
        date1904 = workbook.find('m:workbookPr', NS)
        epoch = date(1904, 1, 1) if date1904 is not None and date1904.attrib.get('date1904') in ('1', 'true') else date(1899, 12, 30)
        records = []
        for source_row, values in parsed[1:]:
            try:
                raw_date = values.get(columns['date'])
                if raw_date is None:
                    raise ValueError('Date is missing')
                if re.fullmatch(r'\d+(?:\.\d+)?', raw_date):
                    transaction_date = epoch + timedelta(days=int(Decimal(raw_date)))
                else:
                    parts = re.fullmatch(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', raw_date.strip())
                    transaction_date = date(int(parts[3]), int(parts[2]), int(parts[1])) if parts else date.fromisoformat(raw_date.strip())
                record = {'date': transaction_date.isoformat(), 'description': values.get(columns['description']) or ''}
                for field in ['debit', 'credit', 'balance']:
                    value = values.get(columns[field])
                    if value in (None, ''):
                        record[field] = None
                    else:
                        amount = Decimal(str(value).replace(',', ''))
                        if not amount.is_finite() or abs(amount - amount.quantize(Decimal('0.01'))) > Decimal('0.0000001'):
                            raise ValueError('Invalid monetary amount')
                        record[field] = float(amount.quantize(Decimal('0.01')))
                records.append(record)
            except (ValueError, ArithmeticError) as error:
                raise ValueError(f'HLB row {source_row}: {error}') from error
        # Stable sorting preserves the worksheet order within each date.
        records.sort(key=lambda record: record['date'])
        return {'source': 'Transaction.xlsx', 'sheet': 'HLB', 'rows': records}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        path = urlsplit(self.path).path
        if path == '/api/hlb':
            try:
                payload = read_hlb(ROOT / 'Transaction.xlsx')
                status = 200
            except (OSError, ValueError, KeyError, zipfile.BadZipFile, ET.ParseError) as error:
                payload = {'error': str(error)}
                status = 422
            data = json.dumps(payload, allow_nan=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        # Serve the UI assets while keeping the source workbook off static routes.
        if path not in ('/', '/index.html', '/components/data-table.js'):
            self.send_error(404)
            return
        super().do_GET()

    def do_HEAD(self):
        if urlsplit(self.path).path not in ('/', '/index.html', '/components/data-table.js'):
            self.send_error(404)
            return
        super().do_HEAD()


if __name__ == '__main__':
    server = ThreadingHTTPServer(('127.0.0.1', 4318), Handler)
    print('ZYFN preview at http://127.0.0.1:4318/#hlb', flush=True)
    server.serve_forever()
