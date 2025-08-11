# ESLint Rules Documentation

This document provides a comprehensive overview of all ESLint rules configured in this project, with examples of correct (good) and incorrect (bad) code for each rule.

## Table of Contents

1. [TypeScript ESLint Rules](#typescript-eslint-rules)
2. [React Rules](#react-rules)
3. [React Hooks Rules](#react-hooks-rules)
4. [Import/Export Rules](#importexport-rules)
5. [Code Quality Rules](#code-quality-rules)
6. [Security Rules](#security-rules)
7. [Style Rules](#style-rules)
8. [Plugin-Specific Rules](#plugin-specific-rules)

---

## TypeScript ESLint Rules

### @typescript-eslint/no-explicit-any

**Description**: Disallow usage of the `any` type.

**Level**: Off (disabled in this config)

✅ **Good**:

```typescript
// Use specific types
function processData(data: string[]): number {
  return data.length;
}

// Use generic types
function identity<T>(arg: T): T {
  return arg;
}

// Use unknown for truly unknown types
function parseJson(json: string): unknown {
  return JSON.parse(json);
}
```

❌ **Bad**:

```typescript
// Using any defeats TypeScript's type checking
function processData(data: any): any {
  return data.whatever.length;
}

let userInput: any = getUserInput();
```

### @typescript-eslint/no-unused-vars

**Description**: Disallow unused variables, with configuration for ignored patterns.

**Level**: Error

**Configuration**:

- `vars: "all"` - Check all variables
- `args: "after-used"` - Check arguments after the last used one
- `ignoreRestSiblings: true` - Ignore rest siblings in destructuring
- `argsIgnorePattern: "^_"` - Ignore args starting with underscore
- `varsIgnorePattern: "^_"` - Ignore vars starting with underscore

✅ **Good**:

```typescript
// Used variable
const activeUser = getUser();
console.log(activeUser);

// Ignored unused variable with underscore
const _unusedHelper = createHelper();

// Rest siblings ignored
const { used, ...rest } = props;
console.log(used);

// Ignored unused parameter
function handler(_event: Event, data: string) {
  console.log(data);
}
```

❌ **Bad**:

```typescript
// Unused variable
const unusedData = fetchData();

// Unused parameter without underscore prefix
function handler(event: Event, data: string) {
  console.log(data); // event is unused
}
```

### @typescript-eslint/no-non-null-assertion

**Description**: Disallow non-null assertions using the `!` postfix operator.

**Level**: Error

✅ **Good**:

```typescript
// Use optional chaining and nullish coalescing
const name = user?.profile?.name ?? "Unknown";

// Use type guards
if (user && user.profile) {
  console.log(user.profile.name);
}

// Use explicit null checks
if (element !== null) {
  element.focus();
}
```

❌ **Bad**:

```typescript
// Non-null assertion can cause runtime errors
const name = user!.profile!.name;

// Dangerous assumption
const element = document.getElementById("myId")!;
element.focus(); // Could throw if element is null
```

### @typescript-eslint/prefer-nullish-coalescing

**Description**: Enforce using nullish coalescing operator (`??`) instead of logical or (`||`).

**Level**: Error

✅ **Good**:

```typescript
// Use ?? for null/undefined checks
const name = user.name ?? "Default Name";
const count = user.count ?? 0;
const isEnabled = user.isEnabled ?? false;
```

❌ **Bad**:

```typescript
// || treats falsy values as null/undefined
const name = user.name || "Default Name"; // '' would be replaced
const count = user.count || 0; // 0 would be replaced
const isEnabled = user.isEnabled || false; // false would be replaced
```

### @typescript-eslint/no-floating-promises

**Description**: Require Promise-like values to be handled appropriately.

**Level**: Error

✅ **Good**:

```typescript
// Await the promise
await fetchData();

// Handle with then/catch
fetchData().then(handleData).catch(handleError);

// Explicitly void if intentionally not handled
void fetchData();

// Return the promise
function getData() {
  return fetchData();
}
```

❌ **Bad**:

```typescript
// Floating promise - not handled
fetchData();

// In async function without await
async function processData() {
  fetchData(); // Should be awaited
  return result;
}
```

### @typescript-eslint/await-thenable

**Description**: Disallow awaiting a value that is not a Thenable.

**Level**: Error

✅ **Good**:

```typescript
// Await actual promises
await fetch("/api/data");
await Promise.resolve(42);

// Don't await non-promises
const result = getValue();
const number = 42;
```

❌ **Bad**:

```typescript
// Awaiting non-thenable values
await 42;
await "string";
await { not: "a promise" };

// Awaiting synchronous functions
function syncFunction() {
  return "result";
}
await syncFunction();
await syncFunction(); // syncFunction doesn't return a promise
// syncFunction doesn't return a promise
```

### @typescript-eslint/no-misused-promises

**Description**: Avoid using promises in places not designed to handle them.

**Level**: Error

✅ **Good**:

```typescript
// Proper async event handler
button.addEventListener("click", async (event) => {
  await handleClick(event);
});

// Sync condition
if (user.isActive) {
  doSomething();
}

// Proper promise handling
const result = await checkCondition();
if (result) {
  doSomething();
}
```

❌ **Bad**:

```typescript
// Promise in if condition
if (fetchUserData()) {
  // Returns promise, always truthy
  doSomething();
}

// Promise as array callback without await
users.filter(async (user) => await user.isActive()); // Returns Promise<boolean>[]
```

### @typescript-eslint/require-await

**Description**: Disallow async functions which have no await expression.

**Level**: Error

✅ **Good**:

```typescript
// Async function with await
async function fetchData() {
  const response = await fetch("/api");
  return response.json();
}

// Sync function without async
function processData(data: string) {
  return data.toUpperCase();
}

// Async function returning promise
async function getData() {
  return Promise.resolve("data");
}
```

❌ **Bad**:

```typescript
// Async function without await
async function processData(data: string) {
  return data.toUpperCase(); // No await needed, shouldn't be async
}

// Async function with only sync operations
async function calculateSum(a: number, b: number) {
  return a + b;
}
```

### @typescript-eslint/no-unnecessary-type-assertion

**Description**: Warns if a type assertion does not change the type of an expression.

**Level**: Warning

✅ **Good**:

```typescript
// Necessary type assertion
const element = document.getElementById("myId") as HTMLInputElement;

// No assertion needed
const name: string = "John";
const age = 25;
```

❌ **Bad**:

```typescript
// Unnecessary type assertion
const name = "John" as string; // Already string
const age = 25 as number; // Already number

// Redundant assertion
const user: User = getUser() as User; // getUser() already returns User
```

### @typescript-eslint/prefer-optional-chain

**Description**: Prefer using concise optional chaining expressions.

**Level**: Warning

✅ **Good**:

```typescript
// Use optional chaining
const street = user?.address?.street;
const result = obj?.method?.();
const item = arr?.[0]?.property;
```

❌ **Bad**:

```typescript
// Manual null checking
const street = user && user.address && user.address.street;
const result = obj && obj.method && obj.method();
const item = arr && arr[0] && arr[0].property;
```

### @typescript-eslint/prefer-string-starts-ends-with

**Description**: Enforce using `String#startsWith` and `String#endsWith` instead of other equivalent methods.

**Level**: Warning

✅ **Good**:

```typescript
// Use startsWith/endsWith
const hasPrefix = str.startsWith("prefix");
const hasSuffix = str.endsWith(".js");
```

❌ **Bad**:

```typescript
// Using indexOf
const hasPrefix = str.indexOf("prefix") === 0;
const hasSuffix = str.indexOf(".js") === str.length - 3;

// Using regex
const hasPrefix = /^prefix/.test(str);
const hasSuffix = /\.js$/.test(str);
```

### @typescript-eslint/consistent-type-imports

**Description**: Enforce consistent usage of type imports.

**Level**: Warning

**Configuration**: `{ prefer: "type-imports" }`

✅ **Good**:

```typescript
// Type-only imports
import type { User, Product } from "./types";
import type React from "react";

// Mixed imports
import { useState } from "react";
import type { FC } from "react";
```

❌ **Bad**:

```typescript
// Regular imports for types only
import { User, Product } from "./types"; // Only used as types
import React from "react"; // Only used for type annotations
```

### @typescript-eslint/consistent-type-definitions

**Description**: Enforce type definitions to consistently use either `interface` or `type`.

**Level**: Warning

**Configuration**: `["warn", "interface"]`

✅ **Good**:

```typescript
// Use interface for object types
interface User {
  name: string;
  age: number;
}

interface ApiResponse {
  data: User[];
  status: string;
}
```

❌ **Bad**:

```typescript
// Using type for object shapes
type User = {
  name: string;
  age: number;
};

type ApiResponse = {
  data: User[];
  status: string;
};
```

---

## React Rules

### react/react-in-jsx-scope

**Description**: Prevent missing React when using JSX.

**Level**: Off (disabled for React 17+ with new JSX transform)

✅ **Good** (with React 17+ JSX transform):

```jsx
// No need to import React
function Component() {
  return <div>Hello World</div>;
}
```

❌ **Bad** (with older React versions):

```jsx
// Missing React import
function Component() {
  return <div>Hello World</div>; // Error: React is not defined
}

// Should be:
import React from "react";
function Component() {
  return <div>Hello World</div>;
}
```

---

## React Hooks Rules

### react-hooks/exhaustive-deps

**Description**: Verifies the list of dependencies for Hooks like useEffect and useMemo.

**Level**: Error

✅ **Good**:

```jsx
// All dependencies included
useEffect(() => {
  fetchUser(userId);
}, [userId]);

// No dependencies needed
useEffect(() => {
  const timer = setInterval(() => {
    console.log("tick");
  }, 1000);
  return () => clearInterval(timer);
}, []);

// Function dependency with useCallback
const handleSubmit = useCallback(() => {
  submitForm(formData);
}, [formData]);

useEffect(() => {
  handleSubmit();
}, [handleSubmit]);
```

❌ **Bad**:

```jsx
// Missing dependency
useEffect(() => {
  fetchUser(userId);
}, []); // userId should be in deps

// Stale closure
const [count, setCount] = useState(0);
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1); // count is stale
  }, 1000);
  return () => clearInterval(timer);
}, []); // Should use functional update or include count
```

---

## Import/Export Rules

### simple-import-sort/imports

**Description**: Automatically sort import statements.

**Level**: Warning

✅ **Good**:

```javascript
// Sorted imports
import fs from "fs";
import path from "path";
import React from "react";

import { Button } from "@/components/ui";
import { utils } from "@/lib/utils";

import { helper } from "../utils/helper";
import { Component } from "./Component";
```

❌ **Bad**:

```javascript
// Unsorted imports
import React from "react";
import { Component } from "./Component";
import fs from "fs";
import { Button } from "@/components/ui";
import path from "path";
import { helper } from "../utils/helper";
```

### simple-import-sort/exports

**Description**: Automatically sort export statements.

**Level**: Warning

✅ **Good**:

```javascript
// Sorted exports
export { Button } from "./Button";
export { Card } from "./Card";
export { Dialog } from "./Dialog";
```

❌ **Bad**:

```javascript
// Unsorted exports
export { Dialog } from "./Dialog";
export { Button } from "./Button";
export { Card } from "./Card";
```

### no-restricted-imports

**Description**: Restrict certain imports to enforce architecture decisions.

**Level**: Error

**Configuration**: Restricts relative imports from UI components and enforces absolute imports.

✅ **Good**:

```javascript
// Use absolute imports for UI components
import { Button } from "@/components/ui";
import { Card } from "@/components/ui/card";

// Allowed relative imports for non-UI
import { helper } from "../utils/helper";
```

❌ **Bad**:

```javascript
// Relative imports for UI components
import { Button } from "../../components/ui/button";
import { Card } from "../ui/card";
```

---

## Code Quality Rules

### no-constant-condition

**Description**: Disallow constant expressions in conditions.

**Level**: Error

✅ **Good**:

```javascript
// Dynamic conditions
if (user.isActive) {
  doSomething();
}

// Intentional infinite loop with comment
while (true) {
  // eslint-disable-line no-constant-condition
  // Server polling loop
  if (shouldStop()) break;
}
```

❌ **Bad**:

```javascript
// Constant conditions
if (true) {
  doSomething(); // Always executes
}

if (false) {
  neverExecutes(); // Dead code
}

while (true) {
  // Likely unintentional infinite loop
  doSomething();
}
```

### no-dupe-keys

**Description**: Disallow duplicate keys in object literals.

**Level**: Error

✅ **Good**:

```javascript
// Unique keys
const config = {
  host: "localhost",
  port: 3000,
  debug: true,
};
```

❌ **Bad**:

```javascript
// Duplicate keys - last one wins
const config = {
  host: "localhost",
  port: 3000,
  host: "127.0.0.1", // Overwrites previous host
};
```

### prefer-const

**Description**: Require `const` declarations for variables that are never reassigned.

**Level**: Error

✅ **Good**:

```javascript
// Use const for values that don't change
const API_URL = "https://api.example.com";
const users = getUsers();

// Use let for variables that change
let currentUser = null;
currentUser = await fetchUser();
```

❌ **Bad**:

```javascript
// Using let for values that never change
let API_URL = "https://api.example.com";
let users = getUsers();
// These should be const
```

### complexity

**Description**: Enforce a maximum cyclomatic complexity allowed in a program.

**Level**: Warning

**Configuration**: `{ max: 15 }`

✅ **Good**:

```javascript
// Simple function with low complexity
function validateUser(user) {
  if (!user) return false;
  if (!user.email) return false;
  if (!user.name) return false;
  return true;
}

// Break complex functions into smaller ones
function processOrder(order) {
  if (!validateOrder(order)) {
    return handleInvalidOrder(order);
  }
  return handleValidOrder(order);
}
```

❌ **Bad**:

```javascript
// High complexity function
function processData(data) {
  if (data.type === "A") {
    if (data.status === "active") {
      if (data.priority === "high") {
        // Many nested conditions increase complexity
        if (data.urgent) {
          if (data.category === "critical") {
            // ... more conditions
          }
        }
      }
    }
  } else if (data.type === "B") {
    // ... more complex logic
  }
  // Complexity > 15
}
```

### max-depth

**Description**: Enforce a maximum depth that blocks can be nested.

**Level**: Warning

**Configuration**: `4` levels

✅ **Good**:

```javascript
// Reasonable nesting depth
function processUser(user) {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        return user.data;
      }
    }
  }
  return null;
}

// Use early returns to reduce nesting
function processUserBetter(user) {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.hasPermission) return null;
  return user.data;
}
```

❌ **Bad**:

```javascript
// Too deeply nested (> 4 levels)
function processData(data) {
  if (data) {
    if (data.items) {
      for (const item of data.items) {
        if (item.active) {
          if (item.category) {
            if (item.category.type === "special") {
              // Depth level 6 - too deep!
              return item;
            }
          }
        }
      }
    }
  }
}
```

### max-lines-per-function

**Description**: Enforce a maximum number of lines per function.

**Level**: Warning

**Configuration**: `{ max: 100 }`

✅ **Good**:

```javascript
// Concise function under 100 lines
function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  return total;
}

// Break large functions into smaller ones
function processOrder(order) {
  const validatedOrder = validateOrder(order);
  const calculatedOrder = calculateOrderTotal(validatedOrder);
  return saveOrder(calculatedOrder);
}
```

❌ **Bad**:

```javascript
// Function over 100 lines
function massiveFunction() {
  // Line 1
  // Line 2
  // ...
  // Line 101+ - too long!
  // Should be broken into smaller functions
}
```

---

## Security Rules

### no-eval

**Description**: Disallow the use of `eval()`.

**Level**: Error

✅ **Good**:

```javascript
// Use JSON.parse for parsing JSON
const data = JSON.parse(jsonString);

// Use Function constructor for dynamic functions (with caution)
const fn = new Function("a", "b", "return a + b");

// Use object property access
const property = "name";
const value = obj[property];
```

❌ **Bad**:

```javascript
// Using eval - security risk
const result = eval("2 + 2");
const code = getUserInput();
eval(code); // Extremely dangerous!

// Evaluating user input
const expression = getExpression();
const result = eval(expression); // XSS vulnerability
```

### no-implied-eval

**Description**: Disallow the use of `eval()`-like methods.

**Level**: Error

✅ **Good**:

```javascript
// Use function references
setTimeout(myFunction, 1000);
setInterval(handleUpdate, 5000);

// Use arrow functions
setTimeout(() => {
  console.log("Timer fired");
}, 1000);
```

❌ **Bad**:

```javascript
// String code in setTimeout/setInterval
setTimeout('alert("Hello")', 1000);
setInterval("updateUI()", 5000);

// Implied eval through Function constructor with strings
const fn = Function('alert("Hello")');
```

### no-new-func

**Description**: Disallow `new` operators with the `Function` object.

**Level**: Error

✅ **Good**:

```javascript
// Use regular function declarations
function add(a, b) {
  return a + b;
}

// Use arrow functions
const multiply = (a, b) => a * b;

// Use function expressions
const divide = function (a, b) {
  return a / b;
};
```

❌ **Bad**:

```javascript
// Creating functions with Function constructor
const add = new Function("a", "b", "return a + b");
const code = getUserInput();
const dynamicFn = new Function(code); // Security risk
```

---

## Style Rules

### prefer-template

**Description**: Require template literals instead of string concatenation.

**Level**: Warning

✅ **Good**:

```javascript
// Use template literals
const message = `Hello, ${name}!`;
const url = `${baseUrl}/api/${endpoint}`;
const multiline = `
  This is a
  multiline string
`;
```

❌ **Bad**:

```javascript
// String concatenation
const message = "Hello, " + name + "!";
const url = baseUrl + "/api/" + endpoint;
const multiline = "This is a\n" + "multiline string";
```

### object-shorthand

**Description**: Require or disallow method and property shorthand syntax for object literals.

**Level**: Warning

✅ **Good**:

```javascript
// Use shorthand properties and methods
const user = {
  name,
  age,
  getName() {
    return this.name;
  },
};

// Arrow functions when appropriate
const utils = {
  format: (value) => value.toString(),
  validate,
};
```

❌ **Bad**:

```javascript
// Verbose object syntax
const user = {
  name: name,
  age: age,
  getName: function () {
    return this.name;
  },
};

const utils = {
  format: function (value) {
    return value.toString();
  },
  validate: validate,
};
```

---

## Plugin-Specific Rules

### no-barrel-files/no-barrel-files

**Description**: Disallow barrel exports (index files that only re-export from other modules).

**Level**: Warning

✅ **Good**:

```javascript
// Direct imports
import { Button } from "./components/Button";
import { Card } from "./components/Card";

// Actual implementation in index files
// index.ts
export const API_VERSION = "1.0";
export class ApiClient {
  // implementation
}
```

❌ **Bad**:

```javascript
// Barrel file - index.ts
export { Button } from "./Button";
export { Card } from "./Card";
export { Dialog } from "./Dialog";
// Only re-exports, no actual code

// Using barrel imports
import { Button, Card } from "./components"; // Through barrel file
```

### no-restricted-syntax

**Description**: Disallow specified syntax.

**Level**: Error

**Configuration**: Disallows `new Error()` in favor of derived error classes.

✅ **Good**:

```javascript
// Use custom error classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

class NetworkError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = "NetworkError";
    this.statusCode = statusCode;
  }
}

// Throw custom errors
throw new ValidationError("Invalid input");
throw new NetworkError("Request failed", 500);
```

❌ **Bad**:

```javascript
// Generic Error constructor
throw new Error("Something went wrong");
throw new Error("Validation failed");
throw new Error("Network error");
```

---

## React Specific Rules

### react/jsx-no-leaked-render

**Description**: Prevent problematic leaked values from being rendered.

**Level**: Warning

✅ **Good**:

```jsx
// Proper conditional rendering
{
  users.length > 0 && <UserList users={users} />;
}
{
  isLoading ? <Spinner /> : <Content />;
}
{
  user?.isActive && <ActiveUserBadge />;
}

// Using ternary for falsy values
{
  count ? <Count value={count} /> : null;
}
{
  items.length ? <ItemList items={items} /> : <EmptyState />;
}
```

❌ **Bad**:

```jsx
// Leaked render - 0 will be rendered
{
  count && <Count value={count} />;
}

// Empty string will be rendered
{
  message && <Message text={message} />;
}

// NaN or other falsy values
{
  items.length && <ItemList items={items} />;
}
```

### react/self-closing-comp

**Description**: Prevent extra closing tags for components without children.

**Level**: Warning

✅ **Good**:

```jsx
// Self-closing components
<Button />
<Input placeholder="Enter name" />
<Icon name="user" />
```

❌ **Bad**:

```jsx
// Unnecessary closing tags
<Button></Button>
<Input placeholder="Enter name"></Input>
<Icon name="user"></Icon>
```

### react/jsx-boolean-value

**Description**: Enforce boolean attributes notation in JSX.

**Level**: Warning

✅ **Good**:

```jsx
// Consistent boolean prop syntax
<Button disabled />
<Input required />
<Checkbox checked />

// Or explicit values
<Button disabled={true} />
<Input required={false} />
```

❌ **Bad**:

```jsx
// Inconsistent boolean values
<Button disabled={true} />  // Should be just disabled
<Input required="true" />   // Should be boolean
<Checkbox checked="false" /> // Should be boolean false
```

### react/no-array-index-key

**Description**: Prevent usage of Array index in keys.

**Level**: Warning

✅ **Good**:

```jsx
// Use stable, unique identifiers
{
  users.map((user) => <UserCard key={user.id} user={user} />);
}

// Generate stable keys for static lists
const menuItems = ["Home", "About", "Contact"];
{
  menuItems.map((item) => <MenuItem key={item} text={item} />);
}
```

❌ **Bad**:

```jsx
// Using array index as key
{
  users.map((user, index) => <UserCard key={index} user={user} />);
}

// Can cause rendering issues when list changes
{
  items.map((item, i) => <Item key={i} data={item} />);
}
```

### react/jsx-no-bind

**Description**: Prevents usage of `.bind()` and arrow functions in JSX props.

**Level**: Warning

**Configuration**: `{ ignoreDOMComponents: false }`

✅ **Good**:

```jsx
// Use useCallback for event handlers
const handleClick = useCallback(() => {
  setCount(count + 1);
}, [count]);

const handleSubmit = useCallback((data) => {
  submitForm(data);
}, []);

return (
  <div>
    <button onClick={handleClick}>Click me</button>
    <Form onSubmit={handleSubmit} />
  </div>
);

// Or define handlers outside component
function handleStaticClick() {
  console.log("Static handler");
}

<button onClick={handleStaticClick}>Click</button>;
```

❌ **Bad**:

```jsx
// Inline arrow functions create new functions on each render
<button onClick={() => setCount(count + 1)}>Click me</button>
<Form onSubmit={(data) => submitForm(data)} />

// Using .bind() creates new functions
<button onClick={this.handleClick.bind(this)}>Click me</button>
```

### react/jsx-no-constructed-context-values

**Description**: Prevents JSX context provider values from taking values that will cause needless rerenders.

**Level**: Warning

✅ **Good**:

```jsx
// Memoize context values
const contextValue = useMemo(() => ({
  user,
  updateUser,
  isLoading
}), [user, updateUser, isLoading]);

<UserContext.Provider value={contextValue}>
  {children}
</UserContext.Provider>

// Or use state directly if it's already stable
<UserContext.Provider value={userState}>
  {children}
</UserContext.Provider>
```

❌ **Bad**:

```jsx
// Object literal creates new object on every render
<UserContext.Provider value={{ user, updateUser, isLoading }}>
  {children}
</UserContext.Provider>

// Array literal creates new array on every render
<ThemeContext.Provider value={[theme, setTheme]}>
  {children}
</ThemeContext.Provider>
```

---

This documentation covers all the ESLint rules configured in the project. Each rule includes:

- **Description**: What the rule does
- **Level**: The severity level (error, warning, or off)
- **Configuration**: Any specific configuration options
- ✅ **Good**: Examples of code that follows the rule
- ❌ **Bad**: Examples of code that violates the rule

For more detailed information about any specific rule, refer to the official ESLint documentation or the respective plugin documentation.
