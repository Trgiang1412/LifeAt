import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'lifeat_lofi_secret_jwt_key_2026_super_secure_random';

export interface JwtUserPayload {
  userId: string;
  taiKhoan: string;
  tenDangNhap: string;
  roomId: string;
}

export function signJwtToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyJwtToken(token: string): JwtUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtUserPayload;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

