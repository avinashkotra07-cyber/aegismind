import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '..', '..', 'data', 'aegismind.json');

// Initial default state
const initialData = {
  users: [],
  threat_incidents: [],
  quarantine_list: [],
  code_patches: [],
  interceptor_state: {
    mode: 'ACTIVE_BLOCK', // 'ACTIVE_BLOCK', 'PASSIVE_MONITOR', 'ZERO_TRUST_STRICT'
    total_packets_inspected: 142,
    total_threats_blocked: 29,
    paused_packets: []
  },
  system_policies: [
    {
      id: uuidv4(),
      policy_name: 'GLOBAL_DEFAULT',
      quarantine_threshold: 80,
      auto_patch_threshold: 95,
      honeypot_redirect_enabled: true,
      webhook_url: 'https://hooks.slack.com/services/aegismind/alerts',
      updated_at: new Date().toISOString()
    }
  ]
};

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Helper to read DB
const readDB = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      writeDB(initialData);
      seedInitialData();
      return readDB();
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file:', err);
    return initialData;
  }
};

// Helper to write DB
const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database file:', err);
  }
};

// Seed admin user and initial sample incidents
const seedInitialData = () => {
  const db = readDB();
  
  // Seed admin user if none exists
  if (db.users.length === 0) {
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync('Admin@123', salt);
    
    db.users.push({
      id: uuidv4(),
      email: 'admin@aegismind.io',
      password_hash,
      full_name: 'Lead Cyber Officer',
      role: 'admin',
      created_at: new Date().toISOString()
    });

    db.users.push({
      id: uuidv4(),
      email: 'analyst@aegismind.io',
      password_hash: bcrypt.hashSync('Analyst@123', salt),
      full_name: 'Security Analyst',
      role: 'sec_analyst',
      created_at: new Date().toISOString()
    });
  }

  // Seed baseline threat incidents if empty
  if (db.threat_incidents.length === 0) {
    const inc1Id = uuidv4();
    const inc2Id = uuidv4();
    const inc3Id = uuidv4();

    db.threat_incidents.push(
      {
        id: inc1Id,
        client_ip: '192.168.1.105',
        request_method: 'POST',
        request_path: '/api/v1/users/search',
        payload: { username: "admin' OR '1'='1' --", query_type: 'raw' },
        headers: { 'user-agent': 'sqlmap/1.5.11#stable', accept: '*/*' },
        threat_category: 'SQL Injection',
        owasp_mapping: 'A03:2021-Injection',
        risk_score: 95,
        action_taken: 'QUARANTINED',
        is_quarantined: true,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: inc2Id,
        client_ip: '10.0.4.88',
        request_method: 'POST',
        request_path: '/api/v1/system/exec',
        payload: { command: 'ping 127.0.0.1; cat /etc/passwd' },
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        threat_category: 'Command Injection',
        owasp_mapping: 'A03:2021-Injection',
        risk_score: 98,
        action_taken: 'QUARANTINED',
        is_quarantined: true,
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: inc3Id,
        client_ip: '172.16.0.42',
        request_method: 'GET',
        request_path: '/api/v1/fetch-url',
        payload: { target_url: 'http://169.254.169.254/latest/meta-data/' },
        headers: { 'user-agent': 'CustomPythonScript/2.1' },
        threat_category: 'Server-Side Request Forgery',
        owasp_mapping: 'A10:2021-SSRF',
        risk_score: 88,
        action_taken: 'QUARANTINED',
        is_quarantined: true,
        created_at: new Date(Date.now() - 3600000 * 8).toISOString()
      }
    );

    // Initial quarantine records
    db.quarantine_list.push(
      {
        id: uuidv4(),
        ip_address: '192.168.1.105',
        reason: 'OWASP A03: SQL Injection detected in /api/v1/users/search (Score: 95)',
        associated_incident_id: inc1Id,
        status: 'ACTIVE',
        quarantined_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        expires_at: null
      },
      {
        id: uuidv4(),
        ip_address: '10.0.4.88',
        reason: 'OWASP A03: Remote Command Execution attack in /api/v1/system/exec (Score: 98)',
        associated_incident_id: inc2Id,
        status: 'ACTIVE',
        quarantined_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        expires_at: null
      }
    );

    // Initial proposed patch
    db.code_patches.push({
      id: uuidv4(),
      incident_id: inc1Id,
      file_path: 'server/src/controllers/userController.js',
      vulnerable_code: "const query = `SELECT * FROM users WHERE username = '${req.body.username}'`;\nconst results = await db.query(query);",
      remediated_code: "const query = 'SELECT * FROM users WHERE username = $1';\nconst results = await db.query(query, [req.body.username]);",
      diff_patch: "--- old/userController.js\n+++ new/userController.js\n@@ -14,2 +14,2 @@\n- const query = `SELECT * FROM users WHERE username = '${req.body.username}'`;\n- const results = await db.query(query);\n+ const query = 'SELECT * FROM users WHERE username = $1';\n+ const results = await db.query(query, [req.body.username]);",
      explanation: "Replaced inline string interpolation with parameterized binding ($1) to completely eliminate SQL injection vulnerability.",
      sandbox_test_status: 'PASSED',
      deployment_status: 'PROPOSED',
      applied_by: null,
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString()
    });
  }

  writeDB(db);
};

// Initialize DB on module load
seedInitialData();

export const db = {
  // Users
  findUserByEmail: (email) => {
    const data = readDB();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  findUserById: (id) => {
    const data = readDB();
    return data.users.find((u) => u.id === id);
  },
  createUser: (userData) => {
    const data = readDB();
    const newUser = {
      id: uuidv4(),
      ...userData,
      created_at: new Date().toISOString()
    };
    data.users.push(newUser);
    writeDB(data);
    return newUser;
  },

  // Threat Incidents
  getThreats: ({ limit = 50, page = 1, category, search, minScore } = {}) => {
    const data = readDB();
    let list = [...data.threat_incidents];

    if (category) {
      list = list.filter((t) => t.threat_category.toLowerCase().includes(category.toLowerCase()));
    }
    if (minScore) {
      list = list.filter((t) => t.risk_score >= Number(minScore));
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.client_ip.includes(q) ||
          t.request_path.toLowerCase().includes(q) ||
          t.threat_category.toLowerCase().includes(q) ||
          t.owasp_mapping.toLowerCase().includes(q)
      );
    }

    // Sort descending by creation date
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const total = list.length;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return { threats: paginated, total, page, totalPages: Math.ceil(total / limit) };
  },

  getThreatById: (id) => {
    const data = readDB();
    return data.threat_incidents.find((t) => t.id === id);
  },

  createThreat: (threatData) => {
    const data = readDB();
    const newThreat = {
      id: uuidv4(),
      action_taken: threatData.risk_score >= 80 ? 'QUARANTINED' : threatData.risk_score >= 50 ? 'LOGGED' : 'ALLOWED',
      is_quarantined: threatData.risk_score >= 80,
      created_at: new Date().toISOString(),
      ...threatData
    };
    data.threat_incidents.unshift(newThreat);
    writeDB(data);
    return newThreat;
  },

  // Quarantine List
  getQuarantineList: () => {
    const data = readDB();
    return data.quarantine_list.sort((a, b) => new Date(b.quarantined_at) - new Date(a.quarantined_at));
  },

  isIpQuarantined: (ip) => {
    const data = readDB();
    return data.quarantine_list.some((q) => q.ip_address === ip && q.status === 'ACTIVE');
  },

  addToQuarantine: ({ ip_address, reason, associated_incident_id }) => {
    const data = readDB();
    const existing = data.quarantine_list.find((q) => q.ip_address === ip_address);
    if (existing) {
      existing.status = 'ACTIVE';
      existing.reason = reason;
      existing.quarantined_at = new Date().toISOString();
      writeDB(data);
      return existing;
    }
    const newEntry = {
      id: uuidv4(),
      ip_address,
      reason,
      associated_incident_id: associated_incident_id || null,
      status: 'ACTIVE',
      quarantined_at: new Date().toISOString(),
      expires_at: null
    };
    data.quarantine_list.unshift(newEntry);
    writeDB(data);
    return newEntry;
  },

  removeFromQuarantine: (ip_address) => {
    const data = readDB();
    const entry = data.quarantine_list.find((q) => q.ip_address === ip_address);
    if (entry) {
      entry.status = 'RELEASED';
      writeDB(data);
      return true;
    }
    return false;
  },

  // Code Patches
  getPatches: () => {
    const data = readDB();
    return data.code_patches.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getPatchById: (id) => {
    const data = readDB();
    return data.code_patches.find((p) => p.id === id);
  },

  createPatch: (patchData) => {
    const data = readDB();
    const newPatch = {
      id: uuidv4(),
      sandbox_test_status: 'PENDING',
      deployment_status: 'PROPOSED',
      applied_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...patchData
    };
    data.code_patches.unshift(newPatch);
    writeDB(data);
    return newPatch;
  },

  updatePatchStatus: (id, { sandbox_test_status, deployment_status, applied_by }) => {
    const data = readDB();
    const patch = data.code_patches.find((p) => p.id === id);
    if (patch) {
      if (sandbox_test_status) patch.sandbox_test_status = sandbox_test_status;
      if (deployment_status) patch.deployment_status = deployment_status;
      if (applied_by) patch.applied_by = applied_by;
      patch.updated_at = new Date().toISOString();
      writeDB(data);
      return patch;
    }
    return null;
  },

  // System Policy
  getPolicies: () => {
    const data = readDB();
    return data.system_policies[0] || initialData.system_policies[0];
  },

  updatePolicies: (policyUpdates) => {
    const data = readDB();
    const policy = data.system_policies[0];
    if (policy) {
      Object.assign(policy, policyUpdates, { updated_at: new Date().toISOString() });
      writeDB(data);
      return policy;
    }
    return null;
  },

  // Interceptor State
  getInterceptorState: () => {
    const data = readDB();
    if (!data.interceptor_state) {
      data.interceptor_state = { mode: 'ACTIVE_BLOCK', total_packets_inspected: 142, total_threats_blocked: 29 };
      writeDB(data);
    }
    return data.interceptor_state;
  },

  updateInterceptorMode: (mode) => {
    const data = readDB();
    if (!data.interceptor_state) {
      data.interceptor_state = { mode: 'ACTIVE_BLOCK', total_packets_inspected: 142, total_threats_blocked: 29 };
    }
    data.interceptor_state.mode = mode;
    writeDB(data);
    return data.interceptor_state;
  },

  incrementPacketCount: (isBlocked = false) => {
    const data = readDB();
    if (!data.interceptor_state) {
      data.interceptor_state = { mode: 'ACTIVE_BLOCK', total_packets_inspected: 0, total_threats_blocked: 0 };
    }
    data.interceptor_state.total_packets_inspected = (data.interceptor_state.total_packets_inspected || 0) + 1;
    if (isBlocked) {
      data.interceptor_state.total_threats_blocked = (data.interceptor_state.total_threats_blocked || 0) + 1;
    }
    writeDB(data);
    return data.interceptor_state;
  }
};
