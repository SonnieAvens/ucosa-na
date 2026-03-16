// Mock better-sqlite3 so tests run without the native binary
jest.mock('better-sqlite3', () => {
  const stmtMock = {
    get: jest.fn().mockReturnValue(undefined),
    all: jest.fn().mockReturnValue([]),
    run: jest.fn().mockReturnValue({ lastInsertRowid: 1, changes: 1 }),
  };
  const dbMock = {
    prepare: jest.fn().mockReturnValue(stmtMock),
    exec: jest.fn(),
    close: jest.fn(),
  };
  return jest.fn().mockReturnValue(dbMock);
});

// Set JWT_SECRET before requiring the app
process.env.JWT_SECRET = 'test-secret-for-jest';

const request = require('supertest');
const { app, server } = require('../index');

afterAll(() => server.close());

describe('GET /', () => {
  it('returns 200 with HTML page', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/html/);
  });
});

describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /nonexistent', () => {
  it('returns 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 400 when credentials are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/admin/users', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.statusCode).toBe(401);
  });
});
