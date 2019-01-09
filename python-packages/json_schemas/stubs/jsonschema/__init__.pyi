from typing import Any, Dict, Tuple


class RefResolver:
    def resolve(self, url: str) -> Tuple[str, Dict]:
        ...


class ValidationError(Exception): pass

def validate(instance: Any, schema: Dict, cls=None, *args, **kwargs) -> None: pass
