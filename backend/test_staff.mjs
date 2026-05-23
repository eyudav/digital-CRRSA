async function run() {
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@crrsa.gov', password: 'demo1234' })
  });
  if (!loginRes.ok) return console.log("Login fail", await loginRes.text());
  const { token } = await loginRes.json();
  
  const res = await fetch('http://localhost:4000/api/staff/applications/1/status', {
    method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ status: 'Approved', comment: 'Looks good' })
  });
  console.log("Patch Status:", res.status);
  console.log(await res.text());
}
run();
