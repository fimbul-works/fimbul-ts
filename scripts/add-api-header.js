import fs from "node:fs";

// Project settings
const PROJECT_TITLE = "Fimbul";
const LANGUAGE = "typescript";
const PROJECT_TAGS = [LANGUAGE, "algorithm", "library"];

// Load package.json
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

// Extract GitHub repository from homepage
let github = "";
if (pkg.homepage) {
  const homepageUrl = new URL(pkg.homepage);
  homepageUrl.hash = "";
  github = homepageUrl.toString();
}

// Fallback to repository field if homepage isn't set
if (!github && pkg.repository) {
  const repo = typeof pkg.repository === "string" ? pkg.repository : pkg.repository.url;
  github = repo.replace(/^git\+/, "").replace(/\.git$/, "");
}

// Add keywords to tags (with safety check)
const keywords = pkg.keywords || [];
const tags = [...new Set([...PROJECT_TAGS, ...keywords])];

// Remove description quotes and trailing period for cleaner output
const description = pkg.description.replace(/^["']|["']$/g, "").replace(/\.$/, "");

const header = `---
title: ${PROJECT_TITLE} API Documentation
description: ${description}
package: "${pkg.name}"
version: ${pkg.version}
language: ${LANGUAGE}
npm: https://www.npmjs.com/package/${pkg.name}
github: ${github}
tags:
  - ${tags.join("\n  - ")}
---

# ${PROJECT_TITLE} API Documentation

Complete API for [${PROJECT_TITLE}](README.md) - ${pkg.description.toLowerCase()}.

`;

const apiContent = fs.readFileSync("API.md", "utf8");
fs.writeFileSync("API.md", header + apiContent);
