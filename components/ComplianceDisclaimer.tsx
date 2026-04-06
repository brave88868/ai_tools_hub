export default function ComplianceDisclaimer() {
  return (
    <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
      <span className="shrink-0 text-amber-500">⚠️</span>
      <p>
        <strong>Disclaimer:</strong> This tool uses AI to generate compliance-related content for
        informational purposes only. The output does not constitute legal, regulatory,
        or professional compliance advice. Laws and regulations vary by jurisdiction and
        change frequently. Always verify with a qualified compliance professional or legal
        advisor before acting on any AI-generated content.
      </p>
    </div>
  );
}
