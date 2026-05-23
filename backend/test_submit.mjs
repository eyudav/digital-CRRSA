async function run() {
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'citizen@crrsa.gov', password: 'demo1234' })
  });
  if (!loginRes.ok) return console.log("Login fail", await loginRes.text());
  const { token } = await loginRes.json();
  
  const subRes = await fetch('http://localhost:4000/api/applications', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: JSON.stringify({ serviceType: 'Birth Registration', officeCode: 'Addis Ababa — Bole Sub-City', formData: { childName: 'Test' } })
  });
  console.log("Status:", subRes.status);
  console.log(await subRes.text());
}
run();
