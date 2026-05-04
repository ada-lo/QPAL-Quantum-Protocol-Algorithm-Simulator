from main import _parse_cors_origins


def test_parse_cors_origins_strips_trailing_slashes():
    origins = _parse_cors_origins("http://localhost:5173/, http://127.0.0.1:5173/")

    assert origins == ["http://localhost:5173", "http://127.0.0.1:5173"]


def test_parse_cors_origins_deduplicates_normalized_values():
    origins = _parse_cors_origins("http://localhost:5173,http://localhost:5173/")

    assert origins == ["http://localhost:5173"]
