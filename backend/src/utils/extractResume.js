function extractName(text) {
  const lines = text.split('\n').slice(0, 10);
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})$/);
    if (match) return match[1];
  }
  const fallback = text.match(/([A-Z][a-z]+ [A-Z][a-z]+)/);
  return fallback ? fallback[1] : '';
}

function extractEmail(text) {
  const match = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  return match ? match[0] : '';
}

function extractSkillsFromText(text, knownSkills = []) {
  const lower = text.toLowerCase();
  return knownSkills.filter((skill) => lower.includes(skill.toLowerCase()));
}

module.exports = { extractName, extractEmail, extractSkillsFromText };
