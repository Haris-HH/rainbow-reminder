import pdfMake from 'pdfmake/build/pdfmake'
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import { pdfFontsVfs, pdfFonts } from './pdfFonts'
import { formatMoney } from './format'
import { t } from '@/i18n/strings'
import type { Currency, DeliveryRecord, Lang } from '@/types/database'

pdfMake.addVirtualFileSystem(pdfFontsVfs)
pdfMake.addFonts(pdfFonts)

function groupByHouse(rows: DeliveryRecord[]): [string, DeliveryRecord[]][] {
  const m = new Map<string, DeliveryRecord[]>()
  for (const r of rows) {
    const key = r.house_no || '-'
    if (!m.has(key)) m.set(key, [])
    m.get(key)!.push(r)
  }
  return [...m.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { numeric: true })
  )
}

const sumAmount = (rows: DeliveryRecord[]) =>
  rows.reduce((s, r) => s + Number(r.amount), 0)

const netBalance = (rows: DeliveryRecord[]) =>
  rows.reduce(
    (s, r) => s + (r.paid ? -Number(r.amount) : Number(r.amount)),
    0
  )

function houseBlock(
  house: string,
  rows: DeliveryRecord[],
  currency: Currency,
  lang: Lang,
  sum: number
): Content {
  return {
    unbreakable: true,
    margin: [0, 0, 0, 10],
    stack: [
      {
        columns: [
          { text: `${house}  (${rows.length} ${t('records', lang)})`, bold: true },
          { text: formatMoney(sum, currency), alignment: 'right', bold: true },
        ],
        margin: [0, 0, 0, 4],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 50, 80, 60],
          body: [
            [
              { text: t('date', lang), style: 'tableHeader' },
              { text: t('quantity', lang), style: 'tableHeader' },
              { text: t('amount', lang), style: 'tableHeader' },
              { text: t('paid', lang), style: 'tableHeader' },
            ],
            ...rows.map((r) => [
              r.delivered_at,
              { text: String(r.quantity), alignment: 'center' as const },
              { text: formatMoney(Number(r.amount), currency), alignment: 'right' as const },
              { text: r.paid ? t('paid', lang) : t('unpaid', lang), alignment: 'center' as const },
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      },
    ],
  }
}

function houseGroupsContent(
  rows: DeliveryRecord[],
  currency: Currency,
  lang: Lang,
  netMode: boolean
): Content[] {
  if (rows.length === 0) {
    return [{ text: t('empty', lang), italics: true, margin: [0, 0, 0, 10] }]
  }
  return groupByHouse(rows).map(([house, houseRows]) =>
    houseBlock(
      house,
      houseRows,
      currency,
      lang,
      netMode ? netBalance(houseRows) : sumAmount(houseRows)
    )
  )
}

interface RecordsPdfOptions {
  title: string
  lang: Lang
  currency: Currency
  view: 'list' | 'table'
  rows: DeliveryRecord[]
}

export function buildRecordsDocDefinition({
  title,
  lang,
  currency,
  view,
  rows,
}: RecordsPdfOptions): TDocumentDefinitions {
  const content: Content[] = [
    { text: title, style: 'header' },
  ]

  if (view === 'list') {
    content.push({
      columns: [
        { text: t('outstanding', lang), bold: true },
        { text: formatMoney(netBalance(rows), currency), alignment: 'right', bold: true },
      ],
      margin: [0, 0, 0, 12],
    })
    content.push(...houseGroupsContent(rows, currency, lang, true))
  } else {
    const unpaid = rows.filter((r) => !r.paid)
    const paid = rows.filter((r) => r.paid)

    content.push({
      columns: [
        { text: t('unpaid', lang), style: 'sectionHeader' },
        { text: formatMoney(sumAmount(unpaid), currency), alignment: 'right', style: 'sectionHeader' },
      ],
    })
    content.push(...houseGroupsContent(unpaid, currency, lang, false))

    content.push({
      columns: [
        { text: t('paid', lang), style: 'sectionHeader' },
        { text: formatMoney(sumAmount(paid), currency), alignment: 'right', style: 'sectionHeader' },
      ],
    })
    content.push(...houseGroupsContent(paid, currency, lang, false))
  }

  return {
    info: { title },
    defaultStyle: { font: 'NotoSansThai', fontSize: 9 },
    pageMargins: [30, 30, 30, 30],
    content,
    styles: {
      header: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
      sectionHeader: { fontSize: 12, bold: true, margin: [0, 10, 0, 6] },
      tableHeader: { bold: true, fillColor: '#f2f2f2' },
    },
  }
}

interface PrintRecordsOptions extends RecordsPdfOptions {
  /** window handle opened synchronously in the click handler, to dodge popup blockers */
  win?: Window | null
}

export function printRecordsPdf({ win, ...options }: PrintRecordsOptions) {
  const docDefinition = buildRecordsDocDefinition(options)
  pdfMake.createPdf(docDefinition).print(win)
}
