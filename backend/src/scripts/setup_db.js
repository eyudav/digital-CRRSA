import { pool } from "../config/db.js";

async function run() {
  console.log("Starting database setup...");

  try {
    // 1. Add missing columns to citizen_profiles
    const columnsToAdd = [
      { name: "full_name", type: "text" },
      { name: "sex", type: "text" },
      { name: "date_of_birth", type: "date" },
      { name: "mother_name", type: "text" },
      { name: "father_name", type: "text" },
      { name: "phone_number", type: "text" },
      { name: "email", type: "text" },
      { name: "photo_url", type: "text" },
      { name: "nationality", type: "text" },
      { name: "sub_city", type: "text" },
      { name: "woreda", type: "text" },
      { name: "address", type: "text" },
      { name: "residence_id_number", type: "text" },
    ];

    for (const col of columnsToAdd) {
      await pool.query(`
        ALTER TABLE citizen_profiles 
        ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};
      `);
      console.log(`Ensured column "${col.name}" exists in citizen_profiles.`);
    }

    // Add unique constraint to residence_id_number safely
    try {
      await pool.query(`
        ALTER TABLE citizen_profiles 
        ADD CONSTRAINT citizen_profiles_residence_id_number_key UNIQUE (residence_id_number);
      `);
      console.log("Added unique constraint on residence_id_number.");
    } catch (e) {
      // Constraint might already exist
      console.log("Unique constraint on residence_id_number already exists or failed to add (expected if already there).");
    }

    // 2. Create form_templates table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS form_templates (
        id bigserial primary key,
        service_slug text not null unique,
        service_name text not null,
        fields jsonb not null default '[]'::jsonb,
        version int not null default 1,
        is_active boolean not null default true,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `);
    console.log("Ensured form_templates table exists.");

    // 3. Seed form templates for the 8 services
    const templates = [
      {
        slug: "birth-certificate",
        name: "Birth Registration & Birth Certificate",
        fields: JSON.stringify([
          { name: "applicantRole", label: "Who can apply", type: "text" },
          { name: "childName", label: "Child full name", type: "text" },
          { name: "childSex", label: "Child sex", type: "text" },
          { name: "childDob", label: "Child date of birth", type: "date" },
          { name: "motherName", label: "Mother full name", type: "text" },
          { name: "fatherName", label: "Father full name", type: "text" }
        ])
      },
      {
        slug: "marriage-certificate",
        name: "Marriage Registration & Certificate",
        fields: JSON.stringify([
          { name: "groomName", label: "Groom full name", type: "text" },
          { name: "brideName", label: "Bride full name", type: "text" },
          { name: "weddingDate", label: "Proposed marriage date", type: "date" }
        ])
      },
      {
        slug: "divorce-certificate",
        name: "Divorce Registration & Certificate",
        fields: JSON.stringify([
          { name: "applicantName", label: "Applicant full name", type: "text" },
          { name: "spouseOne", label: "Spouse 1 full name", type: "text" },
          { name: "spouseTwo", label: "Spouse 2 full name", type: "text" },
          { name: "marriageCertNo", label: "Marriage certificate number", type: "text" }
        ])
      },
      {
        slug: "death-certificate",
        name: "Death Registration & Certificate",
        fields: JSON.stringify([
          { name: "applicantName", label: "Applicant full name", type: "text" },
          { name: "deceasedName", label: "Deceased full name", type: "text" },
          { name: "dateOfDeath", label: "Date of death", type: "date" }
        ])
      },
      {
        slug: "id-services",
        name: "Residence ID Service",
        fields: JSON.stringify([
          { name: "fullName", label: "Full name", type: "text" },
          { name: "sex", label: "Sex", type: "text" },
          { name: "dateOfBirth", label: "Date of birth", type: "date" },
          { name: "motherName", label: "Mother's name", type: "text" },
          { name: "fatherName", label: "Father's name", type: "text" }
        ])
      },
      {
        slug: "residency-transfer",
        name: "Residency Transfer Certificate",
        fields: JSON.stringify([
          { name: "fullName", label: "Full name", type: "text" },
          { name: "currentAddress", label: "Current residence address", type: "text" },
          { name: "newAddress", label: "New residence address", type: "text" }
        ])
      },
      {
        slug: "certificate-of-no-impediment",
        name: "Non-Marital (Single Status) Certificate",
        fields: JSON.stringify([
          { name: "fullName", label: "Full name", type: "text" },
          { name: "maritalStatusDecl", label: "Marital status declaration", type: "text" }
        ])
      },
      {
        slug: "residency-proof-letter",
        name: "Residency Verification Letter",
        fields: JSON.stringify([
          { name: "fullName", label: "Full name", type: "text" },
          { name: "residenceIdNo", label: "Residence ID number", type: "text" }
        ])
      }
    ];

    for (const t of templates) {
      await pool.query(`
        INSERT INTO form_templates (service_slug, service_name, fields, version, is_active, updated_at)
        VALUES ($1, $2, $3, 1, true, now())
        ON CONFLICT (service_slug) DO UPDATE
        SET service_name = EXCLUDED.service_name,
            fields = EXCLUDED.fields,
            updated_at = now();
      `, [t.slug, t.name, t.fields]);
      console.log(`Seeded form template for: "${t.name}" (${t.slug})`);
    }

    console.log("Database setup completed successfully!");

  } catch (err) {
    console.error("Database setup failed:", err);
  } finally {
    await pool.end();
  }
}

run();
