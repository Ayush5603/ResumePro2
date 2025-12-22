import express from "express";
import multer from "multer";
import fs from "fs";
import pdfParse from "pdf-parse";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post("/check-ats", upload.single("resume"), async (req, res) => {
    try {
        const jobDesc = req.body.jobDesc;
        const pdfData = await pdfParse(fs.readFileSync(req.file.path));

        const userResume = pdfData.text;

        const prompt = `
Compare the following resume with the job description.
Give results in this JSON format:

{
 "ats_score": "0-100",
 "missing_keywords": [],
 "strengths": [],
 "weaknesses": [],
 "improvements": []
}

Resume:
${userResume}

Job Description:
${jobDesc}
`;

        const response = await model.generateContent(prompt);
        const output = response.response.text();

        res.json(JSON.parse(output));
    } catch (err) {
        res.json({ error: err.message });
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));
