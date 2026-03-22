"""
Авторизация: регистрация, вход, выход, получение текущего пользователя.
POST /register — регистрация
POST /login — вход
POST /logout — выход
GET /me — текущий пользователь по токену
"""
import json
import os
import hashlib
import secrets
import psycopg2


SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "public")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def make_token() -> str:
    return secrets.token_hex(32)


def get_user_by_token(conn, token: str):
    with conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT u.id, u.name, u.username, u.email, u.bio, u.verified,
                   u.followers_count, u.following_count, u.posts_count
            FROM {SCHEMA}.sessions s
            JOIN {SCHEMA}.users u ON u.id = s.user_id
            WHERE s.token = '{token}' AND s.expires_at > NOW()
            """,
        )
        row = cur.fetchone()
    if not row:
        return None
    return {
        "id": row[0], "name": row[1], "username": row[2], "email": row[3],
        "bio": row[4], "verified": row[5],
        "followersCount": row[6], "followingCount": row[7], "postsCount": row[8],
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    path = event.get("path", "/")
    method = event.get("httpMethod", "GET")
    headers = event.get("headers") or {}
    token = headers.get("X-Auth-Token", "")

    body = {}
    if event.get("body"):
        body = json.loads(event["body"])

    conn = get_conn()

    # GET /me
    if method == "GET" and path.endswith("/me"):
        if not token:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}
        user = get_user_by_token(conn, token)
        if not user:
            return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Токен недействителен"})}
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"user": user})}

    # POST /register
    if method == "POST" and path.endswith("/register"):
        name = body.get("name", "").strip()
        username = body.get("username", "").strip().lower()
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")

        if not all([name, username, email, password]):
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Заполните все поля"})}
        if len(password) < 6:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Пароль минимум 6 символов"})}

        pw_hash = hash_password(password)
        with conn.cursor() as cur:
            cur.execute(
                f"SELECT id FROM {SCHEMA}.users WHERE email = '{email}' OR username = '{username}'"
            )
            if cur.fetchone():
                conn.close()
                return {"statusCode": 409, "headers": CORS, "body": json.dumps({"error": "Email или имя пользователя уже занято"})}
            cur.execute(
                f"""INSERT INTO {SCHEMA}.users (name, username, email, password_hash)
                    VALUES ('{name}', '{username}', '{email}', '{pw_hash}') RETURNING id"""
            )
            user_id = cur.fetchone()[0]
            new_token = make_token()
            cur.execute(
                f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES ({user_id}, '{new_token}')"
            )
        conn.commit()
        conn.close()
        return {
            "statusCode": 200, "headers": CORS,
            "body": json.dumps({
                "token": new_token,
                "user": {"id": user_id, "name": name, "username": username, "email": email,
                         "bio": "", "verified": False, "followersCount": 0, "followingCount": 0, "postsCount": 0}
            })
        }

    # POST /login
    if method == "POST" and path.endswith("/login"):
        email = body.get("email", "").strip().lower()
        password = body.get("password", "")
        if not email or not password:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Введите email и пароль"})}

        pw_hash = hash_password(password)
        with conn.cursor() as cur:
            cur.execute(
                f"""SELECT id, name, username, bio, verified, followers_count, following_count, posts_count
                    FROM {SCHEMA}.users WHERE email = '{email}' AND password_hash = '{pw_hash}'"""
            )
            row = cur.fetchone()
            if not row:
                conn.close()
                return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Неверный email или пароль"})}
            user_id, name, username, bio, verified, fc, fwc, pc = row
            new_token = make_token()
            cur.execute(
                f"INSERT INTO {SCHEMA}.sessions (user_id, token) VALUES ({user_id}, '{new_token}')"
            )
        conn.commit()
        conn.close()
        return {
            "statusCode": 200, "headers": CORS,
            "body": json.dumps({
                "token": new_token,
                "user": {"id": user_id, "name": name, "username": username, "email": email,
                         "bio": bio, "verified": verified,
                         "followersCount": fc, "followingCount": fwc, "postsCount": pc}
            })
        }

    # POST /logout
    if method == "POST" and path.endswith("/logout"):
        if token:
            with conn.cursor() as cur:
                cur.execute(f"UPDATE {SCHEMA}.sessions SET expires_at = NOW() WHERE token = '{token}'")
            conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    conn.close()
    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}
