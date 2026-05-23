async function test() {
  try {
    const res = await fetch("http://localhost:4000/api/applications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Needs a valid citizen JWT...
      },
      body: JSON.stringify({
        serviceType: "Birth Certificate",
        officeCode: "Addis Ababa — Bole Sub-City",
        formData: { childName: "Test" }
      })
    });
    const text = await res.text();
    console.log("Status:", res.status, "Body:", text);
  } catch (err) {
    console.error(err);
  }
}
test();
