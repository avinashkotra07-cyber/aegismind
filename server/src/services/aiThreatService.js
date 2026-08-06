import { geminiModel } from '../config/gemini.js';

const SYSTEM_PROMPT = `You are AegisMind-Core, an enterprise autonomous cyber defense AI agent specialized in real-time threat detection, OWASP Top 10 telemetry classification, and secure source code remediation.

Your mission is to evaluate incoming HTTP request payloads, detect exploitation attempts, determine risk scores, and output structured, syntactically valid JSON responses without markdown wrapped outside the JSON format.

When analyzing vulnerabilities:
1. Provide exact OWASP Top 10 (2021) classifications.
2. Calculate a deterministic risk score from 0 (harmless) to 100 (critical exploit).
3. Identify payload signatures (e.g., SQLi, Command Injection, XSS, Path Traversal, SSRF, IDOR).
4. Provide immediate mitigation steps.

Return ONLY a JSON object with this exact shape:
{
  "is_malicious": boolean,
  "risk_score": number,
  "threat_category": string,
  "owasp_mapping": string,
  "attack_vector_description": string,
  "recommended_action": "QUARANTINE" | "LOG" | "ALLOW"
}`;

export const analyzePayloadWithAI = async ({ ip, method, path, headers = {}, body = {}, query = {} }) => {
  const payloadStr = JSON.stringify({ body, query, headers });

  // If Gemini model is active, perform live generative analysis
  if (geminiModel) {
    try {
      const userPrompt = JSON.stringify({
        system_prompt: "Analyze the following HTTP request context and payload for security threats.",
        input_data: { ip, method, path, headers, body, query }
      });

      const result = await geminiModel.generateContent([SYSTEM_PROMPT, userPrompt]);
      const text = result.response.text();
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const jsonResponse = JSON.parse(cleanedText);
      return jsonResponse;
    } catch (err) {
      console.warn('⚠️ Gemini AI classification failed, using Rule-Engine fallback:', err.message);
    }
  }

  // Rule-Engine Deterministic Fallback
  return fallbackRuleClassifier({ method, path, headers, body, query });
};

const fallbackRuleClassifier = ({ path, headers, body, query }) => {
  const fullContent = JSON.stringify({ path, headers, body, query }).toLowerCase();

  // SQL Injection signatures
  if (
    /('|\"|\bOR\b|\bAND\b).+?(=|<|>|LIKE)|UNION\s+SELECT|--|\/\*|\*\/|DROP\s+TABLE|INFORMATION_SCHEMA|SLEEP\(\d+\)|BENCHMARK\(/i.test(
      fullContent
    )
  ) {
    return {
      is_malicious: true,
      risk_score: 95,
      threat_category: 'SQL Injection',
      owasp_mapping: 'A03:2021-Injection',
      attack_vector_description: 'SQL Injection signature detected via boolean logic bypass or syntax corruption.',
      recommended_action: 'QUARANTINE'
    };
  }

  // Command Injection signatures
  if (
    /;\s*(cat|ls|id|whoami|ping|nc|bash|sh|curl|wget|powershell|cmd)|\|\||&&|\$\(|=|`.*`/i.test(fullContent)
  ) {
    return {
      is_malicious: true,
      risk_score: 98,
      threat_category: 'Command Injection',
      owasp_mapping: 'A03:2021-Injection',
      attack_vector_description: 'Remote Command Execution payload detected attempting system shell invocation.',
      recommended_action: 'QUARANTINE'
    };
  }

  // XSS signatures
  if (/<script|javascript:|onerror=|onload=|alert\(|document\.cookie|<iframe|<img\s+src/i.test(fullContent)) {
    return {
      is_malicious: true,
      risk_score: 85,
      threat_category: 'Cross-Site Scripting (XSS)',
      owasp_mapping: 'A03:2021-Injection',
      attack_vector_description: 'Cross-Site Scripting (XSS) snippet detected attempting client script execution.',
      recommended_action: 'QUARANTINE'
    };
  }

  // SSRF signatures
  if (/169\.254\.169\.254|localhost|127\.0\.0\.1|file:\/\/|gopher:\/\/|dict:\/\//i.test(fullContent)) {
    return {
      is_malicious: true,
      risk_score: 90,
      threat_category: 'Server-Side Request Forgery',
      owasp_mapping: 'A10:2021-SSRF',
      attack_vector_description: 'SSRF payload attempting internal IP / cloud metadata access.',
      recommended_action: 'QUARANTINE'
    };
  }

  // Path Traversal
  if (/\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\/etc\/passwd|\/windows\/win\.ini/i.test(fullContent)) {
    return {
      is_malicious: true,
      risk_score: 88,
      threat_category: 'Path Traversal',
      owasp_mapping: 'A01:2021-Broken Access Control',
      attack_vector_description: 'Directory traversal payload attempting unauthorized file access.',
      recommended_action: 'QUARANTINE'
    };
  }

  // Legitimate request
  return {
    is_malicious: false,
    risk_score: 5,
    threat_category: 'None',
    owasp_mapping: 'None',
    attack_vector_description: 'Legitimate request pattern.',
    recommended_action: 'ALLOW'
  };
};
