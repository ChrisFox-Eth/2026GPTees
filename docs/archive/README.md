# Archive

This directory contains historical planning documents, diagnostic artifacts, and temporary files that have been moved from the repository root to reduce clutter while preserving history.

## Structure

```
archive/
├── plans/           # Historical planning directories
│   ├── conversion-boost-plan/
│   ├── design-first-flow/
│   ├── gift-promo-codes-plan/
│   ├── launch-ready-tickets/
│   ├── product-dev-plan/
│   ├── product-roadmap/
│   ├── promo-analytics-dashboard-plan/
│   └── social-ops-plan/
├── tickets/         # One-off ticket collections
│   └── feedback-tickets/
├── diagnostics/     # Debug reports, fix logs, troubleshooting docs
│   ├── AUDIT.md
│   ├── CART_DEBUG.md
│   ├── CLERK_TURNSTILE_FIX.md
│   ├── DEPLOY_FIX.md
│   ├── FINAL_FIXES.md
│   ├── FIXES_APPLIED.md
│   ├── GAP_ANALYSIS_GO_LIVE.md
│   ├── IMMEDIATE_ACTIONS.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── PRODUCT_OWNER_README.md
│   ├── PROGRESS_SUMMARY.md
│   ├── TROUBLESHOOTING_AUTH.md
│   ├── USER_SYNC_FIX.md
│   ├── WEBHOOK_DIAGNOSIS.md
│   ├── WEBHOOK_FAILURE_DEBUG.md
│   └── manual-user-sync.sql
├── temp/            # Temporary scripts and notes
│   ├── temp.txt
│   └── temp_patch.py
└── social-docs/     # Removed social media feature documentation
    ├── SOCIAL_MEDIA.md
    ├── social_csv_template.csv
    ├── social_fb_ig_export.csv
    ├── social_import_template.md
    └── social_posts_import.md
```

## Why Archive?

- **Reduced cognitive load**: Root directory now shows only runtime code and living documentation.
- **Preserved history**: All planning artifacts remain accessible for reference.
- **Clear separation**: Runtime vs. historical artifacts are now visually distinct.

## Living Docs (kept at root)

The following files remain at the repository root because they are actively used:
- `README.md` - Main project documentation
- `CONTRIBUTING.md` - Contribution guidelines
- `DEPLOYMENT.md` - Deployment instructions
- `CLAUDE.md` - AI assistant configuration
- `.env.example` - Environment variable template
- `package.json` - Root package configuration

## Note

The `repo-cleanup-plan/` directory is intentionally kept at root as it contains the active cleanup tickets being worked on. It will be archived once the cleanup is complete.
