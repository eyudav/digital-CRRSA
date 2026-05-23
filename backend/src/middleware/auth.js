import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query } from "../config/db.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing bearer token" });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const { rows } = await query(
      `select id, role, email, full_name, is_active, sub_city, woreda, phone, address
       from users where id = $1`,
      [decoded.sub]
    );
    const dbUser = rows[0];
    if (!dbUser || !dbUser.is_active) {
      return res.status(401).json({ message: "Account is inactive" });
    }
    req.user = {
      sub: dbUser.id,
      role: dbUser.role,
      email: dbUser.email,
      fullName: dbUser.full_name,
      subCity: dbUser.sub_city,
      woreda: dbUser.woreda,
      phone: dbUser.phone,
      address: dbUser.address,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    const flatRoles = roles.flat();
    if (!req.user || !flatRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden for this role" });
    }
    return next();
  };
}
