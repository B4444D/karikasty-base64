// pages/api/testpost.js

export const config = {
    api: {
      bodyParser: true
    }
  };
  
  export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'POST فقط مسموح' });
    }
  
    try {
      const { test } = req.body;
      return res.status(200).json({ message: '🎉 الطلب POST يعمل!', received: test });
    } catch (error) {
      return res.status(500).json({ error: 'فشل تحليل الجسم' });
    }
  }
  