import { Hono } from 'hono';
import { query } from '../db/connection';

const seo = new Hono();

seo.get('/', async (c) => {
  const path = c.req.query('path') || '/';
  const seoData = await query(
    'SELECT * FROM seo_meta WHERE page_path = ?',
    [path]
  ) as any[];

  return c.json(seoData[0] || {
    title_en: 'RemoteWeb3 - Web3 Remote Jobs & Crypto Careers',
    title_zh: 'RemoteWeb3 - Web3 远程工作与加密职业',
    description_en: 'Find the best Web3, blockchain, and crypto remote jobs. Browse 70,000+ jobs from top Web3 companies worldwide.',
    description_zh: '找到最好的Web3、区块链和加密远程工作。浏览来自全球顶级Web3公司的70,000+工作岗位。',
    keywords: 'web3 jobs,crypto jobs,blockchain jobs,remote jobs,defi,nft,smart contract,solidity,rust',
  });
});

export { seo as seoRouter };
