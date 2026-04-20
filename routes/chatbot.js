const express = require('express');
const router = express.Router();
const pool = require('../db'); 
const { GoogleGenAI, ThinkingLevel } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = 'gemini-3-flash-preview';


// TODO: Store chatlogs and make a continuous converstation(multi-turn conversation)
// const chat = ai.chats.create({
// model: "gemini-3-flash-preview",
// history: [ ....etc

router.post('/', async (req, res) => {
    const { question, history } = req.body;
    
    try {
        const menuResult = await pool.query('SELECT * FROM menu_item WHERE item_id < 200');

        const chat = ai.chats.create({
            model: model,
            history: history,
            config: {
                thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL},
                // systemInstruction: ``
            }
        });
        const response = await chat.sendMessage({
            message: `Context: ${JSON.stringify(menuResult.rows)}.  Only respond with knowledge from context.
             If you don't know, say you're not sure. Be friendly, but match the customer's vibe. 
             Your responses go into a text message, keep it short, simple, and sweet. No Emoji's please.
             Customer asks: <BEGIN<<${question}>>END>`,
        });

        res.json({ success: true, advice: response.text });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;