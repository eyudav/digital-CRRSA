

async function run() {
  try {
    const res = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "citizen@example.com",
        password: "Password123"
      })
    });
    console.log("Status:", res.status);
    const body = await res.text();
    console.log("Response:", body);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
