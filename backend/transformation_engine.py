"""
Data Transformation Engine - Phase 3.1
Provides 40+ transformation functions for workflow data manipulation
"""

import re
import json
import math
import csv
from io import StringIO
from datetime import datetime, timedelta
from typing import Any, List, Dict, Union, Callable
import xml.etree.ElementTree as ET
from jsonpath_ng import parse as jsonpath_parse


# ========== STRING OPERATIONS ==========

def transform_split(value: str, delimiter: str = ",") -> List[str]:
    """Split string by delimiter"""
    if not isinstance(value, str):
        value = str(value)
    return value.split(delimiter)


def transform_join(value: List[Any], delimiter: str = ",") -> str:
    """Join array elements into string"""
    if not isinstance(value, list):
        return str(value)
    return delimiter.join(str(item) for item in value)


def transform_format(template: str, variables: Dict[str, Any]) -> str:
    """Format string template with variables"""
    try:
        return template.format(**variables)
    except (KeyError, ValueError) as e:
        return f"Error: {str(e)}"


def transform_uppercase(value: str) -> str:
    """Convert string to uppercase"""
    return str(value).upper()


def transform_lowercase(value: str) -> str:
    """Convert string to lowercase"""
    return str(value).lower()


def transform_trim(value: str) -> str:
    """Remove leading and trailing whitespace"""
    return str(value).strip()


def transform_substring(value: str, start: int, end: int = None) -> str:
    """Extract substring"""
    value = str(value)
    if end is None:
        return value[start:]
    return value[start:end]


def transform_replace(value: str, find: str, replace: str) -> str:
    """Replace occurrences in string"""
    return str(value).replace(find, replace)


def transform_concat(*args) -> str:
    """Concatenate multiple strings"""
    return "".join(str(arg) for arg in args)


def transform_length(value: Union[str, List, Dict]) -> int:
    """Get length of string, array, or object"""
    return len(value)


def transform_regex_match(value: str, pattern: str) -> bool:
    """Check if string matches regex pattern"""
    return bool(re.match(pattern, str(value)))


def transform_regex_extract(value: str, pattern: str, group: int = 0) -> str:
    """Extract matched groups from string"""
    match = re.search(pattern, str(value))
    return match.group(group) if match else ""


# ========== MATH OPERATIONS ==========

def transform_sum(value: List[Union[int, float]]) -> Union[int, float]:
    """Sum of array elements"""
    try:
        return sum(float(x) for x in value)
    except (ValueError, TypeError):
        return 0


def transform_average(value: List[Union[int, float]]) -> float:
    """Average of array elements"""
    try:
        numbers = [float(x) for x in value]
        return sum(numbers) / len(numbers) if numbers else 0
    except (ValueError, TypeError):
        return 0


def transform_round(value: float, decimals: int = 0) -> float:
    """Round number to decimals"""
    try:
        return round(float(value), decimals)
    except (ValueError, TypeError):
        return 0


def transform_min(value: List[Union[int, float]]) -> Union[int, float]:
    """Minimum value in array"""
    try:
        return min(float(x) for x in value)
    except (ValueError, TypeError):
        return 0


def transform_max(value: List[Union[int, float]]) -> Union[int, float]:
    """Maximum value in array"""
    try:
        return max(float(x) for x in value)
    except (ValueError, TypeError):
        return 0


def transform_abs(value: Union[int, float]) -> Union[int, float]:
    """Absolute value"""
    try:
        return abs(float(value))
    except (ValueError, TypeError):
        return 0


def transform_ceil(value: float) -> int:
    """Ceiling function"""
    try:
        return math.ceil(float(value))
    except (ValueError, TypeError):
        return 0


def transform_floor(value: float) -> int:
    """Floor function"""
    try:
        return math.floor(float(value))
    except (ValueError, TypeError):
        return 0


def transform_power(value: float, exponent: float) -> float:
    """Raise to power"""
    try:
        return float(value) ** float(exponent)
    except (ValueError, TypeError):
        return 0


def transform_sqrt(value: float) -> float:
    """Square root"""
    try:
        return math.sqrt(float(value))
    except (ValueError, TypeError):
        return 0


# ========== DATE OPERATIONS ==========

def transform_format_date(value: Union[str, datetime], format_str: str = "%Y-%m-%d") -> str:
    """Format date to string"""
    try:
        if isinstance(value, str):
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        return value.strftime(format_str)
    except (ValueError, AttributeError):
        return str(value)


def transform_add_days(value: Union[str, datetime], days: int) -> str:
    """Add days to date"""
    try:
        if isinstance(value, str):
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        result = value + timedelta(days=days)
        return result.isoformat()
    except (ValueError, AttributeError):
        return str(value)


def transform_subtract_days(value: Union[str, datetime], days: int) -> str:
    """Subtract days from date"""
    try:
        if isinstance(value, str):
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        result = value - timedelta(days=days)
        return result.isoformat()
    except (ValueError, AttributeError):
        return str(value)


def transform_add_months(value: Union[str, datetime], months: int) -> str:
    """Add months to date (approximate - 30 days per month)"""
    return transform_add_days(value, months * 30)


def transform_parse_date(value: str, format_str: str = "%Y-%m-%d") -> str:
    """Parse date string"""
    try:
        dt = datetime.strptime(value, format_str)
        return dt.isoformat()
    except ValueError:
        return value


def transform_date_diff(date1: Union[str, datetime], date2: Union[str, datetime]) -> int:
    """Calculate difference in days between two dates"""
    try:
        if isinstance(date1, str):
            date1 = datetime.fromisoformat(date1.replace('Z', '+00:00'))
        if isinstance(date2, str):
            date2 = datetime.fromisoformat(date2.replace('Z', '+00:00'))
        diff = date1 - date2
        return diff.days
    except (ValueError, AttributeError):
        return 0


def transform_now() -> str:
    """Get current date and time"""
    return datetime.now().isoformat()


def transform_today() -> str:
    """Get current date (no time)"""
    return datetime.now().date().isoformat()


# ========== ARRAY OPERATIONS ==========

def transform_filter(value: List[Any], condition: str) -> List[Any]:
    """Filter array by condition (simplified)"""
    # This is a simplified version - in production, use a safe expression evaluator
    try:
        # For now, support simple conditions like "> 10", "== 'value'", etc.
        if not isinstance(value, list):
            return []
        
        # Basic condition parsing
        condition = condition.strip()
        if condition.startswith('>'):
            threshold = float(condition[1:].strip())
            return [x for x in value if isinstance(x, (int, float)) and x > threshold]
        elif condition.startswith('<'):
            threshold = float(condition[1:].strip())
            return [x for x in value if isinstance(x, (int, float)) and x < threshold]
        elif '==' in condition:
            target = condition.split('==')[1].strip().strip('"\'')
            return [x for x in value if str(x) == target]
        else:
            return value
    except:
        return value


def transform_map(value: List[Any], field: str = None) -> List[Any]:
    """Map array to extract field or transform"""
    try:
        if not isinstance(value, list):
            return []
        
        if field:
            # Extract field from each object
            return [item.get(field) if isinstance(item, dict) else item for item in value]
        
        return value
    except:
        return value


def transform_reduce(value: List[Union[int, float]], operation: str = "sum") -> Union[int, float]:
    """Reduce array to single value"""
    try:
        if operation == "sum":
            return transform_sum(value)
        elif operation == "average":
            return transform_average(value)
        elif operation == "min":
            return transform_min(value)
        elif operation == "max":
            return transform_max(value)
        elif operation == "count":
            return len(value)
        else:
            return 0
    except:
        return 0


def transform_sort(value: List[Any], order: str = "asc") -> List[Any]:
    """Sort array"""
    try:
        if not isinstance(value, list):
            return value
        
        sorted_list = sorted(value)
        return sorted_list if order == "asc" else sorted_list[::-1]
    except:
        return value


def transform_unique(value: List[Any]) -> List[Any]:
    """Get unique values from array"""
    try:
        if not isinstance(value, list):
            return value
        
        # Preserve order while removing duplicates
        seen = set()
        result = []
        for item in value:
            # Handle unhashable types
            try:
                if item not in seen:
                    seen.add(item)
                    result.append(item)
            except TypeError:
                # For unhashable types, just append
                result.append(item)
        return result
    except:
        return value


def transform_flatten(value: List[Any]) -> List[Any]:
    """Flatten nested array one level"""
    try:
        if not isinstance(value, list):
            return value
        
        result = []
        for item in value:
            if isinstance(item, list):
                result.extend(item)
            else:
                result.append(item)
        return result
    except:
        return value


def transform_first(value: List[Any]) -> Any:
    """Get first element of array"""
    try:
        return value[0] if isinstance(value, list) and value else None
    except:
        return None


def transform_last(value: List[Any]) -> Any:
    """Get last element of array"""
    try:
        return value[-1] if isinstance(value, list) and value else None
    except:
        return None


def transform_slice(value: List[Any], start: int, end: int = None) -> List[Any]:
    """Slice array"""
    try:
        if not isinstance(value, list):
            return value
        return value[start:end] if end is not None else value[start:]
    except:
        return value


def transform_reverse(value: List[Any]) -> List[Any]:
    """Reverse array"""
    try:
        if not isinstance(value, list):
            return value
        return value[::-1]
    except:
        return value


# ========== OBJECT OPERATIONS ==========

def transform_merge(*objects) -> Dict[str, Any]:
    """Merge multiple objects"""
    result = {}
    for obj in objects:
        if isinstance(obj, dict):
            result.update(obj)
    return result


def transform_extract(obj: Dict[str, Any], keys: List[str]) -> Dict[str, Any]:
    """Extract specific keys from object"""
    try:
        if not isinstance(obj, dict):
            return {}
        return {key: obj.get(key) for key in keys if key in obj}
    except:
        return {}


def transform_keys(obj: Dict[str, Any]) -> List[str]:
    """Get object keys"""
    return list(obj.keys()) if isinstance(obj, dict) else []


def transform_values(obj: Dict[str, Any]) -> List[Any]:
    """Get object values"""
    return list(obj.values()) if isinstance(obj, dict) else []


def transform_has_key(obj: Dict[str, Any], key: str) -> bool:
    """Check if object has key"""
    return key in obj if isinstance(obj, dict) else False


def transform_get(obj: Dict[str, Any], key: str, default: Any = None) -> Any:
    """Get value from object with default"""
    return obj.get(key, default) if isinstance(obj, dict) else default


def transform_set(obj: Dict[str, Any], key: str, value: Any) -> Dict[str, Any]:
    """Set value in object"""
    if not isinstance(obj, dict):
        obj = {}
    result = obj.copy()
    result[key] = value
    return result


def transform_remove_key(obj: Dict[str, Any], key: str) -> Dict[str, Any]:
    """Remove key from object"""
    if not isinstance(obj, dict):
        return obj
    result = obj.copy()
    result.pop(key, None)
    return result


# ========== TYPE CONVERSION ==========

def transform_to_string(value: Any) -> str:
    """Convert to string"""
    return str(value)


def transform_to_number(value: Any) -> Union[int, float]:
    """Convert to number"""
    try:
        # Try integer first
        if '.' not in str(value):
            return int(value)
        return float(value)
    except (ValueError, TypeError):
        return 0


def transform_to_boolean(value: Any) -> bool:
    """Convert to boolean"""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', 'yes', '1', 'on')
    return bool(value)


def transform_to_json(value: Any) -> str:
    """Convert to JSON string"""
    try:
        return json.dumps(value)
    except:
        return str(value)


def transform_from_json(value: str) -> Any:
    """Parse JSON string"""
    try:
        return json.loads(value)
    except:
        return value


# ========== JSONPATH SUPPORT ==========

def transform_jsonpath(data: Any, path: str) -> Any:
    """Extract data using JSONPath expression"""
    try:
        jsonpath_expr = jsonpath_parse(path)
        matches = jsonpath_expr.find(data)
        
        if len(matches) == 0:
            return None
        elif len(matches) == 1:
            return matches[0].value
        else:
            return [match.value for match in matches]
    except Exception as e:
        return f"JSONPath Error: {str(e)}"


# ========== XML PARSING ==========

def xml_to_dict(element: ET.Element) -> Dict[str, Any]:
    """Convert XML element to dictionary"""
    result = {}
    
    # Add attributes
    if element.attrib:
        result['@attributes'] = element.attrib
    
    # Add text content
    if element.text and element.text.strip():
        result['text'] = element.text.strip()
    
    # Add child elements
    for child in element:
        child_data = xml_to_dict(child)
        if child.tag in result:
            # Handle multiple children with same tag
            if not isinstance(result[child.tag], list):
                result[child.tag] = [result[child.tag]]
            result[child.tag].append(child_data)
        else:
            result[child.tag] = child_data
    
    return result


def transform_parse_xml(xml_string: str) -> Dict[str, Any]:
    """Parse XML string to dictionary"""
    try:
        root = ET.fromstring(xml_string)
        return {root.tag: xml_to_dict(root)}
    except ET.ParseError as e:
        return {"error": f"XML Parse Error: {str(e)}"}


# ========== CSV PARSING ==========

def transform_parse_csv(csv_string: str, delimiter: str = ",", has_header: bool = True) -> List[Dict[str, Any]]:
    """Parse CSV string to list of dictionaries"""
    try:
        reader = csv.DictReader(StringIO(csv_string), delimiter=delimiter) if has_header else csv.reader(StringIO(csv_string), delimiter=delimiter)
        
        if has_header:
            return list(reader)
        else:
            # Without headers, create numbered keys
            result = []
            for row in reader:
                result.append({f"column_{i}": value for i, value in enumerate(row)})
            return result
    except Exception as e:
        return [{"error": f"CSV Parse Error: {str(e)}"}]


def transform_to_csv(data: List[Dict[str, Any]], delimiter: str = ",") -> str:
    """Convert list of dictionaries to CSV string"""
    try:
        if not data or not isinstance(data, list):
            return ""
        
        output = StringIO()
        if isinstance(data[0], dict):
            fieldnames = list(data[0].keys())
            writer = csv.DictWriter(output, fieldnames=fieldnames, delimiter=delimiter)
            writer.writeheader()
            writer.writerows(data)
        else:
            writer = csv.writer(output, delimiter=delimiter)
            writer.writerows(data)
        
        return output.getvalue()
    except Exception as e:
        return f"CSV Generation Error: {str(e)}"


# ========== TRANSFORMATION REGISTRY ==========

TRANSFORMATION_FUNCTIONS = {
    # String operations
    "split": transform_split,
    "join": transform_join,
    "format": transform_format,
    "uppercase": transform_uppercase,
    "lowercase": transform_lowercase,
    "trim": transform_trim,
    "substring": transform_substring,
    "replace": transform_replace,
    "concat": transform_concat,
    "length": transform_length,
    "regex_match": transform_regex_match,
    "regex_extract": transform_regex_extract,
    
    # Math operations
    "sum": transform_sum,
    "average": transform_average,
    "round": transform_round,
    "min": transform_min,
    "max": transform_max,
    "abs": transform_abs,
    "ceil": transform_ceil,
    "floor": transform_floor,
    "power": transform_power,
    "sqrt": transform_sqrt,
    
    # Date operations
    "format_date": transform_format_date,
    "add_days": transform_add_days,
    "subtract_days": transform_subtract_days,
    "add_months": transform_add_months,
    "parse_date": transform_parse_date,
    "date_diff": transform_date_diff,
    "now": transform_now,
    "today": transform_today,
    
    # Array operations
    "filter": transform_filter,
    "map": transform_map,
    "reduce": transform_reduce,
    "sort": transform_sort,
    "unique": transform_unique,
    "flatten": transform_flatten,
    "first": transform_first,
    "last": transform_last,
    "slice": transform_slice,
    "reverse": transform_reverse,
    
    # Object operations
    "merge": transform_merge,
    "extract": transform_extract,
    "keys": transform_keys,
    "values": transform_values,
    "has_key": transform_has_key,
    "get": transform_get,
    "set": transform_set,
    "remove_key": transform_remove_key,
    
    # Type conversion
    "to_string": transform_to_string,
    "to_number": transform_to_number,
    "to_boolean": transform_to_boolean,
    "to_json": transform_to_json,
    "from_json": transform_from_json,
    
    # Advanced
    "jsonpath": transform_jsonpath,
    "parse_xml": transform_parse_xml,
    "parse_csv": transform_parse_csv,
    "to_csv": transform_to_csv,
}


def apply_transformation(function_name: str, *args, **kwargs) -> Any:
    """Apply a transformation function by name"""
    if function_name not in TRANSFORMATION_FUNCTIONS:
        raise ValueError(f"Unknown transformation function: {function_name}")
    
    func = TRANSFORMATION_FUNCTIONS[function_name]
    return func(*args, **kwargs)


def get_function_metadata() -> Dict[str, Dict[str, Any]]:
    """Get metadata about all transformation functions"""
    return {
        "String Operations": {
            "split": {"params": ["value", "delimiter"], "description": "Split string by delimiter"},
            "join": {"params": ["array", "delimiter"], "description": "Join array into string"},
            "format": {"params": ["template", "variables"], "description": "Format template with variables"},
            "uppercase": {"params": ["value"], "description": "Convert to uppercase"},
            "lowercase": {"params": ["value"], "description": "Convert to lowercase"},
            "trim": {"params": ["value"], "description": "Remove whitespace"},
            "substring": {"params": ["value", "start", "end?"], "description": "Extract substring"},
            "replace": {"params": ["value", "find", "replace"], "description": "Replace text"},
            "concat": {"params": ["...args"], "description": "Concatenate strings"},
            "length": {"params": ["value"], "description": "Get length"},
            "regex_match": {"params": ["value", "pattern"], "description": "Match regex pattern"},
            "regex_extract": {"params": ["value", "pattern", "group?"], "description": "Extract regex group"},
        },
        "Math Operations": {
            "sum": {"params": ["array"], "description": "Sum of numbers"},
            "average": {"params": ["array"], "description": "Average of numbers"},
            "round": {"params": ["value", "decimals?"], "description": "Round number"},
            "min": {"params": ["array"], "description": "Minimum value"},
            "max": {"params": ["array"], "description": "Maximum value"},
            "abs": {"params": ["value"], "description": "Absolute value"},
            "ceil": {"params": ["value"], "description": "Round up"},
            "floor": {"params": ["value"], "description": "Round down"},
            "power": {"params": ["value", "exponent"], "description": "Raise to power"},
            "sqrt": {"params": ["value"], "description": "Square root"},
        },
        "Date Operations": {
            "format_date": {"params": ["date", "format?"], "description": "Format date"},
            "add_days": {"params": ["date", "days"], "description": "Add days to date"},
            "subtract_days": {"params": ["date", "days"], "description": "Subtract days"},
            "add_months": {"params": ["date", "months"], "description": "Add months"},
            "parse_date": {"params": ["value", "format?"], "description": "Parse date string"},
            "date_diff": {"params": ["date1", "date2"], "description": "Days between dates"},
            "now": {"params": [], "description": "Current date and time"},
            "today": {"params": [], "description": "Current date"},
        },
        "Array Operations": {
            "filter": {"params": ["array", "condition"], "description": "Filter array"},
            "map": {"params": ["array", "field?"], "description": "Map/extract field"},
            "reduce": {"params": ["array", "operation"], "description": "Reduce to value"},
            "sort": {"params": ["array", "order?"], "description": "Sort array"},
            "unique": {"params": ["array"], "description": "Unique values"},
            "flatten": {"params": ["array"], "description": "Flatten nested array"},
            "first": {"params": ["array"], "description": "First element"},
            "last": {"params": ["array"], "description": "Last element"},
            "slice": {"params": ["array", "start", "end?"], "description": "Slice array"},
            "reverse": {"params": ["array"], "description": "Reverse array"},
        },
        "Object Operations": {
            "merge": {"params": ["...objects"], "description": "Merge objects"},
            "extract": {"params": ["object", "keys"], "description": "Extract keys"},
            "keys": {"params": ["object"], "description": "Get keys"},
            "values": {"params": ["object"], "description": "Get values"},
            "has_key": {"params": ["object", "key"], "description": "Check if key exists"},
            "get": {"params": ["object", "key", "default?"], "description": "Get value safely"},
            "set": {"params": ["object", "key", "value"], "description": "Set value"},
            "remove_key": {"params": ["object", "key"], "description": "Remove key"},
        },
        "Type Conversion": {
            "to_string": {"params": ["value"], "description": "Convert to string"},
            "to_number": {"params": ["value"], "description": "Convert to number"},
            "to_boolean": {"params": ["value"], "description": "Convert to boolean"},
            "to_json": {"params": ["value"], "description": "Convert to JSON"},
            "from_json": {"params": ["value"], "description": "Parse JSON"},
        },
        "Advanced": {
            "jsonpath": {"params": ["data", "path"], "description": "JSONPath query"},
            "parse_xml": {"params": ["xml_string"], "description": "Parse XML"},
            "parse_csv": {"params": ["csv_string", "delimiter?", "has_header?"], "description": "Parse CSV"},
            "to_csv": {"params": ["data", "delimiter?"], "description": "Convert to CSV"},
        }
    }
