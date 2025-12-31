# CPF Auditor Field Kits

## 📋 Overview

This directory contains the **Field Kit JSON files** for the CPF (Cognitive Persuasion Framework) Auditing Dashboard. Each Field Kit provides structured assessment questionnaires for specific CPF indicators.

## 📁 Directory Structure

```
auditor-field-kit/
└── interactive/
    ├── en-US/               # English field kits
    │   ├── 1.x-authority/
    │   │   ├── indicator_1.1.json
    │   │   ├── indicator_1.2.json
    │   │   └── ...
    │   ├── 2.x-temporal/
    │   ├── 3.x-social/
    │   └── ...
    │
    ├── it-IT/               # Italian field kits
    │   ├── 1.x-authority/
    │   ├── 2.x-temporal/
    │   └── ...
    │
    └── [other-languages]/
```

## 🗂️ Category Mapping

The 10 CPF categories are:

1. **authority** - Authority & Compliance
2. **temporal** - Temporal & Urgency
3. **social** - Social Proof & Influence
4. **affective** - Affective & Emotional
5. **cognitive** - Cognitive Biases
6. **group** - Group Dynamics
7. **stress** - Stress & Pressure
8. **unconscious** - Unconscious Triggers
9. **ai** - AI & Automation
10. **convergent** - Convergent Threats

## 📄 Field Kit JSON Format

Each Field Kit JSON file must follow this structure:

```json
{
  "indicator": "1.1",
  "title": "Authority Figure Impersonation",
  "subtitle": "Assessment of authority-based deception tactics",
  "category": "1. Authority & Compliance",
  "description": {
    "short": "Brief description of the indicator",
    "detailed": "Detailed explanation of what this indicator measures"
  },
  "field_kit": {
    "questions": [
      {
        "text": "Question text here?",
        "type": "single_choice",
        "answer_scale": [
          { "value": 0, "label": "Not Assessed" },
          { "value": 1, "label": "Low Risk" },
          { "value": 2, "label": "Medium Risk" },
          { "value": 3, "label": "High Risk" }
        ]
      }
    ]
  },
  "sections": [
    {
      "id": "quick-assessment",
      "title": "Quick Assessment",
      "items": [
        {
          "id": "q1",
          "type": "radio-list",
          "question": "Question text?",
          "options": [
            { "value": 0, "label": "Not Assessed" },
            { "value": 1, "label": "Low" },
            { "value": 2, "label": "Medium" },
            { "value": 3, "label": "High" }
          ]
        }
      ]
    }
  ]
}
```

## 🔗 URL Pattern

Field Kits are loaded via this URL pattern:

```
/auditor-field-kit/interactive/{language}/{category}.x-{categoryName}/indicator_{id}.json
```

**Examples:**
- `/auditor-field-kit/interactive/en-US/1.x-authority/indicator_1.1.json`
- `/auditor-field-kit/interactive/it-IT/2.x-temporal/indicator_2.5.json`

## 🚀 Usage

The dashboard automatically fetches Field Kits based on:

1. **Selected Indicator** - Category (1-10) + Indicator (1-10)
2. **Organization Language** - Stored in organization metadata
3. **Fallback** - Defaults to `en-US` if language not available

## ⚠️ Important Notes

- **Missing Field Kits**: If a Field Kit is not found, the dashboard will show a user-friendly error message with a "Close & Try Another" button
- **Language Support**: Ensure Field Kits exist for all supported languages (en-US, it-IT, es-ES, fr-FR, de-DE)
- **Format Validation**: All Field Kit JSON files must be valid JSON and follow the structure above
- **Deployment**: This directory must be served as static files by the Express server

## 📦 Deployment

Field Kit files should be:

1. **Created** by the content team (100 indicators × supported languages)
2. **Validated** with a JSON schema validator
3. **Committed** to this directory in git
4. **Served** automatically by Express static file middleware

## 🔧 Development

To add a new Field Kit:

1. Create the appropriate language directory if it doesn't exist
2. Create the category directory (e.g., `1.x-authority`)
3. Create the indicator JSON file (e.g., `indicator_1.1.json`)
4. Follow the JSON structure above
5. Test loading it in the dashboard

## 📚 References

- Main Dashboard: `/dashboard/auditing/index.html`
- Load Function: `dashboard.js` → `loadIndicatorForCompile()`
- Error Handling: Shows user-friendly message if Field Kit not found
- Categories: Defined in `dashboard.js` → `CATEGORY_MAP`

## 🤝 Contributing

When adding new Field Kits:

- ✅ Use consistent JSON formatting (2 spaces indentation)
- ✅ Include both `field_kit` and `sections` for backward compatibility
- ✅ Provide translations for all supported languages
- ✅ Test loading in the dashboard before committing
- ✅ Follow the naming convention exactly

## 📄 License

Copyright © 2025 CertiCredia Italia
