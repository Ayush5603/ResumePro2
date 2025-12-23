// ========== LOAD PDF.JS ==========
const pdfScript = document.createElement("script");
pdfScript.src =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
pdfScript.onload = () => console.log("PDF.js loaded");
document.head.appendChild(pdfScript);

// ========== PDF TEXT EXTRACTION ==========
async function extractTextFromPDF(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        if (!window.pdfjsLib) {
          console.error("pdfjsLib not loaded");
          resolve("");
          return;
        }

        const pdfData = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map(i => i.str).join(" ") + "\n";
        }

        resolve(text);
      } catch (err) {
        console.error("PDF extraction error:", err);
        resolve("");
      }
    };

    reader.readAsArrayBuffer(file);
  });
}

// ========== ATS BUTTON ==========
document.querySelector(".ats-btn").addEventListener("click", async () => {
  const file = document.getElementById("resumeFile")?.files?.[0];

  if (!file) {
    alert("Please upload a resume PDF.");
    return;
  }

  const resumeText = await extractTextFromPDF(file);

  if (!resumeText || resumeText.trim().length < 100) {
    alert("Failed to read resume text.");
    return;
  }

  let response;
  try {
    response = await fetch(
      `${window.location.origin}/api/ats`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText })
      }
    );
  } catch (err) {
    console.error("Network error:", err);
    alert("Network error calling ATS server.");
    return;
  }

  if (!response.ok) {
    const errText = await response.text();
    console.error("ATS API error:", response.status, errText);
    alert("ATS server error.");
    return;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    console.error("JSON parse error:", err);
    alert("Invalid ATS response.");
    return;
  }

  // ========== UI UPDATE ==========
  const scoreBox = document.querySelector(".score");
  const suggestionList = document.querySelector(".suggestion-list");

  scoreBox.textContent = data.ats_score ?? 0;

  scoreBox.style.color =
    data.ats_score >= 90
      ? "green"
      : data.ats_score >= 70
      ? "orange"
      : "red";

  suggestionList.innerHTML = "";

  if (Array.isArray(data.suggestions) && data.suggestions.length) {
    data.suggestions.forEach(s => {
      const li = document.createElement("li");
      li.textContent = s;
      suggestionList.appendChild(li);
    });
  } else {
    suggestionList.innerHTML =
      "<li>No suggestions returned.</li>";
  }
});
