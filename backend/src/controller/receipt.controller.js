import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';


const upload = multer({ storage: multer.memoryStorage() });
export const uploadMiddleware = upload.single('receiptImage');


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const scanReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    console.log("📸 Image received, sending to Vision AI...");

    const image = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const prompt = `
      You are a financial extraction AI. Analyze this receipt image. 
      Extract the line items and their prices. 
      Do NOT include taxes, tips, or totals.
      Return ONLY a strict JSON array of objects with 'item' (string) and 'price' (number) keys.
      Example: [{"item": "Coffee", "price": 4.50}, {"item": "Bagel", "price": 3.00}]
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([prompt, image]);
    
    const rawText = result.response.text();
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const extractedItems = JSON.parse(cleanJson);

    res.status(200).json({
      message: 'Receipt scanned successfully',
      items: extractedItems
    });

  } catch (error) {
    console.error("Receipt Scanner Error:", error);
    res.status(500).json({ error: 'Failed to scan receipt' });
  }
};