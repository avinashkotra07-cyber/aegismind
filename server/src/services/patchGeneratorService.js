import { geminiModel } from '../config/gemini.js';

const SYSTEM_PROMPT = `You are AegisMind-Core Source Code Patch Remediation Specialist.
Given a vulnerable code snippet and attack vector, generate a secure, production-ready replacement code snippet and unified diff patch.

Return ONLY a JSON object with this exact shape:
{
  "file_path": string,
  "vulnerable_code": string,
  "remediated_code": string,
  "explanation": string,
  "diff": string
}`;

export const generateCodePatch = async ({ incident, filePath, vulnerableSnippet }) => {
  const codeToFix = vulnerableSnippet || sampleVulnerableSnippet(incident.threat_category);
  const targetPath = filePath || sampleFilePath(incident.threat_category);

  if (geminiModel) {
    try {
      const userPrompt = JSON.stringify({
        system_prompt: "Given the vulnerable source code snippet and the identified attack vector, generate a secure, production-ready replacement code snippet.",
        input_data: {
          file_path: targetPath,
          vulnerable_code: codeToFix,
          attack_vector: `${incident.threat_category} (${incident.owasp_mapping})`
        }
      });

      const result = await geminiModel.generateContent([SYSTEM_PROMPT, userPrompt]);
      const text = result.response.text();
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (err) {
      console.warn('⚠️ Gemini AI patch generation failed, using rule-based patch generator:', err.message);
    }
  }

  // Deterministic rule-based patch generator fallback
  return fallbackPatchGenerator(targetPath, codeToFix, incident.threat_category);
};

const sampleFilePath = (category) => {
  if (category?.includes('SQL')) return 'server/src/controllers/userController.js';
  if (category?.includes('Command')) return 'server/src/controllers/systemController.js';
  if (category?.includes('SSRF')) return 'server/src/controllers/fetchController.js';
  return 'server/src/controllers/apiController.js';
};

const sampleVulnerableSnippet = (category) => {
  if (category?.includes('SQL')) {
    return "const query = `SELECT * FROM users WHERE username = '${req.body.username}'`;\nconst results = await db.query(query);";
  }
  if (category?.includes('Command')) {
    return "const cmd = `ping ${req.body.ip}`;\nexec(cmd, (err, stdout) => { res.send(stdout); });";
  }
  return "const url = req.query.target_url;\naxios.get(url).then(r => res.send(r.data));";
};

const fallbackPatchGenerator = (filePath, vulnerableCode, category) => {
  if (category?.includes('SQL') || vulnerableCode.includes('SELECT') || vulnerableCode.includes('${')) {
    const remediated = "const query = 'SELECT * FROM users WHERE username = $1';\nconst results = await db.query(query, [req.body.username]);";
    return {
      file_path: filePath,
      vulnerable_code: vulnerableCode,
      remediated_code: remediated,
      explanation: 'Replaced dynamic string concatenation with parameterized SQL query bindings ($1) to completely stop SQL injection.',
      diff: `--- a/${filePath}\n+++ b/${filePath}\n@@ -14,2 +14,2 @@\n- ${vulnerableCode.split('\n').join('\n- ')}\n+ ${remediated.split('\n').join('\n+ ')}`
    };
  }

  if (category?.includes('Command') || vulnerableCode.includes('exec(')) {
    const remediated = "const { execFile } = require('child_process');\n// Restrict execution to safe binary with arguments array\nexecFile('ping', ['-c', '4', String(req.body.ip)], (err, stdout) => { res.send(stdout); });";
    return {
      file_path: filePath,
      vulnerable_code: vulnerableCode,
      remediated_code: remediated,
      explanation: 'Replaced dangerous shell string exec() with execFile() using parameterized arguments array to prevent shell command injection.',
      diff: `--- a/${filePath}\n+++ b/${filePath}\n@@ -20,2 +20,4 @@\n- ${vulnerableCode.split('\n').join('\n- ')}\n+ ${remediated.split('\n').join('\n+ ')}`
    };
  }

  const remediated = "const { URL } = require('url');\nconst parsed = new URL(req.query.target_url);\nif (['127.0.0.1', 'localhost', '169.254.169.254'].includes(parsed.hostname)) {\n  throw new Error('Access to internal endpoints is blocked by AegisMind');\n}\naxios.get(parsed.href).then(r => res.send(r.data));";
  return {
    file_path: filePath,
    vulnerable_code: vulnerableCode,
    remediated_code: remediated,
    explanation: 'Added URL validation and IP blacklist checks to prevent internal metadata and loopback address SSRF exploitation.',
    diff: `--- a/${filePath}\n+++ b/${filePath}\n@@ -8,2 +8,6 @@\n- ${vulnerableCode.split('\n').join('\n- ')}\n+ ${remediated.split('\n').join('\n+ ')}`
  };
};
