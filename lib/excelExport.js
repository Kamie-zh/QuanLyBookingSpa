function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeCell(input) {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return input;
  }
  return { value: input };
}

function cell(input, styleId = 'Data') {
  const { value, style } = normalizeCell(input);
  const isNumber = typeof value === 'number' && Number.isFinite(value);
  const type = isNumber ? 'Number' : 'String';
  return `<Cell ss:StyleID="${style || styleId}"><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
}

function row(values, styleId = 'Data', height) {
  const heightAttr = height ? ` ss:Height="${height}"` : '';
  return `<Row${heightAttr}>${values.map(value => cell(value, styleId)).join('')}</Row>`;
}

export function buildExcelXml({ title, sheets }) {
  const worksheets = sheets.map((sheet) => {
    const rows = [];
    rows.push(row([{ value: sheet.title || title, style: 'Title' }], 'Title', 28));
    if (sheet.subtitle) rows.push(row([{ value: sheet.subtitle, style: 'Subtitle' }], 'Subtitle', 22));
    rows.push(row([]));
    rows.push(row(sheet.headers.map(header => ({ value: header, style: 'Header' })), 'Header', 24));
    rows.push(...sheet.rows.map((values) => row(values.map((value, index) => {
      const header = sheet.headers[index] || '';
      const isCurrency = /doanh thu|tổng|tiền|giá|đơn giá/i.test(header);
      if (typeof value === 'number') {
        return { value, style: isCurrency ? 'Currency' : 'Number' };
      }
      return { value, style: 'Data' };
    }), 'Data', 22)));

    const columnCount = Math.max(sheet.headers.length, ...sheet.rows.map(r => r.length), 1);
    const columns = Array.from({ length: columnCount }, (_, index) => {
      const header = sheet.headers[index] || '';
      const width = /dịch vụ|khách|nhân viên|email/i.test(header) ? 170 : /booking/i.test(header) ? 190 : /doanh thu|tiền|giá/i.test(header) ? 110 : 95;
      return `<Column ss:AutoFitWidth="0" ss:Width="${width}"/>`;
    }).join('');

    return `
      <Worksheet ss:Name="${escapeXml(sheet.name).slice(0, 31)}">
        <Table>${columns}${rows.join('')}</Table>
      </Worksheet>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Title>${escapeXml(title)}</Title>
  </DocumentProperties>
  <Styles>
    <Style ss:ID="Title">
      <Font ss:Bold="1" ss:Size="16" ss:Color="#8B6F47"/>
      <Interior ss:Color="#FDFBF7" ss:Pattern="Solid"/>
      <Alignment ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Subtitle">
      <Font ss:Size="11" ss:Color="#8B8579"/>
      <Alignment ss:Vertical="Center"/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#8B6F47" ss:Pattern="Solid"/>
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D4AF37"/>
      </Borders>
    </Style>
    <Style ss:ID="Data">
      <Alignment ss:Vertical="Center" ss:WrapText="1"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EFE6D8"/>
      </Borders>
    </Style>
    <Style ss:ID="Number">
      <NumberFormat ss:Format="#,##0"/>
      <Alignment ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EFE6D8"/>
      </Borders>
    </Style>
    <Style ss:ID="Currency">
      <NumberFormat ss:Format="#,##0&quot;đ&quot;"/>
      <Alignment ss:Vertical="Center" ss:Horizontal="Right"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#EFE6D8"/>
      </Borders>
    </Style>
  </Styles>
  ${worksheets}
</Workbook>`;
}

export function excelResponse(xml, filename) {
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

export function formatCurrency(value) {
  return Number(value || 0);
}

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN');
}
