from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import json
import re

class FormatJSONView(APIView):
    """
    POST payload:
    {
      "raw": "...",
      "indent": 2,   # 0 = minify
      "auto_fix": true
    }
    """

    def post(self, request):
        raw = request.data.get('raw', '')
        indent = request.data.get('indent', 2)
        auto_fix = bool(request.data.get('auto_fix', False))

        # Validate indent
        try:
            indent = int(indent)
            if indent < 0:
                raise ValueError()
        except Exception:
            return Response({'ok': False, 'error': 'Invalid indent value'}, status=status.HTTP_400_BAD_REQUEST)

        text = raw or ''

        if auto_fix:
            text = self.attempt_fix(text)

        try:
            parsed = json.loads(text)
            if indent == 0:
                # minify
                formatted = json.dumps(parsed, separators=(',', ':'), ensure_ascii=False)
            else:
                formatted = json.dumps(parsed, indent=indent, ensure_ascii=False)
            return Response({'ok': True, 'formatted': formatted, 'valid': True})
        except json.JSONDecodeError as e:
            return Response({'ok': False, 'error': 'Invalid JSON', 'details': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def attempt_fix(self, text: str) -> str:
        """
        Heuristic fixes:
        - backticks -> double quotes
        - single quotes around tokens -> double quotes
        - remove trailing commas before ] or }
        - quote unquoted object keys (simple identifiers)
        - collapse repeated commas
        Note: This is heuristic only.
        """
        s = text

        # replace backticks with double quotes
        s = s.replace('`', '"')

        # Replace simple single-quoted strings with double-quoted strings
        # This will naively replace '...' with "..." even in many cases; it's heuristic.
        def replace_single_quotes(m):
            inner = m.group(1)
            inner = inner.replace('"', '\\"')
            return '"' + inner + '"'
        s = re.sub(r"'([^']*)'", replace_single_quotes, s)

        # remove trailing commas like [1,2,] or {a:1,}
        s = re.sub(r",\s*(\]|})", r"\1", s)

        # collapse repeated commas
        s = re.sub(r",\s*,+", ",", s)

        # add quotes around unquoted keys: { key: ... } -> { "key": ... }
        # Only handles simple identifier keys (letters, digits, underscore).
        def quote_key(m):
            return '"' + m.group(1) + '":'
        s = re.sub(r'([A-Za-z_][A-Za-z0-9_]*)\s*:', quote_key, s)

        return s
