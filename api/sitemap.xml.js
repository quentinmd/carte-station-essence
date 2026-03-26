import { fetchStationsPage, stationSeoUrl, SITE_URL } from './_lib/stations.js'

export default async function handler(req, res) {
  try {
    const pageSize = 100
    const maxPages = 20
    const urls = [`${SITE_URL}/`]

    for (let page = 0; page < maxPages; page += 1) {
      const offset = page * pageSize
      const records = await fetchStationsPage({ limit: pageSize, offset })

      for (const record of records) {
        urls.push(stationSeoUrl(record))
      }

      if (records.length < pageSize) {
        break
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map(
        (url) =>
          `  <url>\n    <loc>${url}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${url.endsWith('/') ? '1.0' : '0.7'}</priority>\n  </url>`,
      )
      .join('\n')}\n</urlset>`

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400')
    res.status(200).send(xml)
  } catch (error) {
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?><error>${error instanceof Error ? error.message : 'Unknown error'}</error>`)
  }
}
