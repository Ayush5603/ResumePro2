function addExperience() {
  const div = document.createElement("div");
  div.className = "box";
  div.innerHTML = `
    <input placeholder="Job Title" class="exp-title">
    <input placeholder="Company Name" class="exp-company">
    <input placeholder="Start Date (e.g., Jun 2023)" class="exp-start">
    <input placeholder="End Date (e.g., Present)" class="exp-end">
    <textarea placeholder="Achievements (one per line)" class="exp-details"></textarea>
  `;
  document.getElementById("experience-section").appendChild(div);
}

function addProject() {
  const div = document.createElement("div");
  div.className = "box";
  div.innerHTML = `
    <input placeholder="Project Title" class="proj-title">
    <textarea placeholder="Project Description" class="proj-desc"></textarea>
    <input placeholder="Tech Stack" class="proj-tech">
    <input placeholder="Project Link" class="proj-link">
  `;
  document.getElementById("project-section").appendChild(div);
}

function addEducation() {
  const div = document.createElement("div");
  div.className = "box";
  div.innerHTML = `
    <input placeholder="Degree" class="edu-degree">
    <input placeholder="School/College" class="edu-school">
    <input placeholder="Passing Year" class="edu-year">
  `;
  document.getElementById("education-section").appendChild(div);
}

async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 15;

  function heading(text) {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text(text, 10, y);
    y += 7;
  }

  function subheading(text) {
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text(text, 10, y);
    y += 5;
  }

  function textBlock(text) {
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(11);
    const split = doc.splitTextToSize(text, 190);
    doc.text(split, 10, y);
    y += split.length * 5;
  }

  function divider() {
    doc.setDrawColor(150);
    doc.line(10, y, 200, y);
    y += 7;
  }

  // ==============================
  // HEADER (Name + Contact)
  // ==============================
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.text(document.getElementById("name").value || "", 10, y);
  y += 10;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(11);

  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const linkedin = document.getElementById("linkedin").value;
  const github = document.getElementById("github").value;
  const location = document.getElementById("location").value;

  if (email) textBlock(`Email: ${email}`);
  if (phone) textBlock(`Phone: ${phone}`);
  if (linkedin) textBlock(`LinkedIn: ${linkedin}`);
  if (github) textBlock(`GitHub: ${github}`);
  if (location) textBlock(`Location: ${location}`);

  divider();

  // ==============================
  // SUMMARY
  // ==============================
  const summary = document.getElementById("summary").value;
  if (summary.trim()) {
    heading("PROFESSIONAL SUMMARY");
    textBlock(summary.trim());
    divider();
  }

  // ==============================
  // SKILLS
  // ==============================
  const skills = document.getElementById("skills").value;
  if (skills.trim()) {
    heading("SKILLS");
    textBlock(skills.split(",").map(s => s.trim()).join(" • "));
    divider();
  }

  // ==============================
  // EXPERIENCE
  // ==============================
  const experiences = document.querySelectorAll("#experience-section .box");
  if (experiences.length > 0) {
    heading("WORK EXPERIENCE");
    experiences.forEach(exp => {
      const title = exp.querySelector(".exp-title").value;
      const company = exp.querySelector(".exp-company").value;
      const start = exp.querySelector(".exp-start").value;
      const end = exp.querySelector(".exp-end").value;
      const details = exp.querySelector(".exp-details").value.split("\n");

      if (title || company) {
        subheading(`${title} — ${company}`);
      }
      if (start || end) {
        textBlock(`${start} - ${end}`);
      }

      details.forEach(d => {
        if (d.trim() !== "") textBlock(`• ${d.trim()}`);
      });

      y += 3;
    });
    divider();
  }

  // ==============================
  // PROJECTS
  // ==============================
  const projects = document.querySelectorAll("#project-section .box");
  if (projects.length > 0) {
    heading("PROJECTS");
    projects.forEach(p => {
      subheading(p.querySelector(".proj-title").value);

      textBlock(p.querySelector(".proj-desc").value);
      textBlock("Tech: " + p.querySelector(".proj-tech").value);

      const link = p.querySelector(".proj-link").value;
      if (link) textBlock("Link: " + link);

      y += 3;
    });
    divider();
  }

  // ==============================
  // EDUCATION
  // ==============================
  const edu = document.querySelectorAll("#education-section .box");
  if (edu.length > 0) {
    heading("EDUCATION");
    edu.forEach(e => {
      const degree = e.querySelector(".edu-degree").value;
      const school = e.querySelector(".edu-school").value;
      const year = e.querySelector(".edu-year").value;

      subheading(`${degree} — ${school}`);
      textBlock(`Year: ${year}`);
      y += 3;
    });
    divider();
  }

  // ==============================
  // CERTIFICATIONS
  // ==============================
  const certs = document.getElementById("certifications").value;
  if (certs.trim()) {
    heading("CERTIFICATIONS");
    textBlock(certs.split(",").map(s => s.trim()).join(" • "));
    divider();
  }

  // ==============================
  // LANGUAGES
  // ==============================
  const langs = document.getElementById("languages").value;
  if (langs.trim()) {
    heading("LANGUAGES");
    textBlock(langs.split(",").map(s => s.trim()).join(" • "));
  }

  doc.save("ATS_Resume.pdf");
}
