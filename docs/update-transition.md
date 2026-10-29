# Windows version transition

[GitHub delivery / English](github-updates.md) · [تسليم GitHub / العربية](github-updates.ar.md)

Public product/file version is1.0.0; the published tag isv1.0.0. Internal update ordering remains2.0.0. New clients discover the latest Stable GitHub Release and verify release, manifest and executable binding, exact size and SHA-256 over restricted HTTPS. Both product and internal-sequence downgrades are rejected.

Internal1.5.3 clients have immutable Sites same-origin updater endpoints and reject a plain1.0.0 numeric offer. They cannot switch to GitHub remotely. The supported first-launch transition is manually installing the verified official ZIP into the same per-user profile. Actual isolated replacement preserved settings/session and previous bytes. Do not replace the owner's installation automatically.

The earlier proposal for paired Sites executable aliases and feeds is superseded for this first public release. Those new files were not deployed; their404s do not block GitHub-aware clients. The old feed is preserved, not falsely advertised as a working automatic bridge. There is no established external legacy customer base.

GitHub-authoritative production discovery, anonymous CDN download and exact hashes passed, as did the real GUI older GitHub-aware QA update and launch-failure rollback fixtures. Separate actual shipping-client Stable detection passed after promotion. QA preview overrides are not shipped.

ترقيم المنتج1.0.0 وترتيب التحديث2.0.0. النسخ الداخلية القديمة تحتاج تثبيت ZIP الرسمي يدويًا مع حفظ ملف المستخدم؛ تستخدم النسخة الجديدة GitHub دون اعتماد على مسارات Sites غير المنشورة. لا ندّعي انتقال1.5.3 تلقائيًا. نجح التحديث الفعلي داخل الضيف والتحقق العام واكتشاف Stable، ولم يتغير تطبيق المالك.
