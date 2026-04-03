/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://ygorstefan.com/ecommerce',
  generateRobotsTxt: true,
  sitemapSize: 7000,
  exclude: ['/admin', '/admin/*', '/checkout', '/account'], // Não indexar rotas protegidas
}
