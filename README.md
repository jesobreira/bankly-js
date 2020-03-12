# Bankly (Acesso)

Unnofficial Javascript class to access [Bankly](http://bankly.com.br/) (by [Acesso](https://www.meuacesso.com.br/)) API.

[API Docs here.](https://bankly.readme.io/)

## Installing

This class is available at NPM.

```javascript
npm i bankly
```

## Usage

Authentication and token refreshing is handled by the class itself.

Start by importing the class and creating an instance supplying your client_id and client_secret provided by Acesso.

```javascript
import Bankly from 'bankly';
// or
const Bankly = require('bankly')
```

```javascript
let bankly = new Bankly('client_id', 'client_secret')
```

### Getting account balance

Provide the branch and account number (without hyphen) to get the balance.

```javascript
bankly.getBalance('0001', '1234')
```

This method returns a promise that resolves to [a JSON object](https://bankly.readme.io/reference#accountbalance).

### Getting account statement

Provide:

* Branch (string)
* Account number (string)
* Offset (number, starts at 0)
* Limit (number, `> 0`)
* Details (optional, boolean, default true)
* DetailsLevelBasic (optional, boolean, default true)

```javascript
bankly.getStatement('0001', '1234', 0, 10)
```

This method returns a promise that resolves to [a JSON object](https://bankly.readme.io/reference#accountstatement).

### Getting account events

Provide:

* Branch (string)
* Account number (string)
* Page (number, starts at 1)
* Pagesize (number, `> 0`)
* IncludeDetails (optional, boolean, default true)

```javascript
bankly.getEvents('0001', '1234', 1, 10)
```

This method returns a promise that resolves to [a JSON object](https://bankly.readme.io/reference#events).

### Performing transfers

**Note**: this method causes subtraction of real money.

In order to specify an origin and destination bank account, you must create two BankAccount objects. You'll need to import it from the library first:

```javascript
import Bankly, { BankAccount } from 'bankly'
// or
const { BankAccount } = require('bankly')
// or
const BankAccount = require('bankly').BankAccount
```

A bank account instance must be created receiving an object with the following properties:

* **branch** (string): account branch
* **account** (string): account number (no hyphen)
* **document** (string): account holder's CPF or CNPJ (numbers only)
* **name** (string): account holder name
* **bankCode** (string, optional): bank code (see below, defaults to Acesso's 332)

Then you will use the `transfer()` method to perform the actual transfer, providing:

* The amount in *centavos* (1 BRL = 100 centavos)
* Reference or description (human-readable string)
* Sender (a BankAccount object)
* Recipient (a BankAccount Object)

Example:

```javascript
let from = new BankAccount({
	branch: '0001',
	account: '1234',
	document: '00000000000000',
	name: 'Company LTDA'
})

let to = new BankAccount({
	bankCode: '123',
	branch: '1234',
	account: '12345',
	document: '00000000000',
	name: 'John Doe'
})

// transfer BRL 5 (R$ 5)
bankly.transfer(500, 'test', from, to)
```

This method returns a promise that resolves to [an object](https://bankly.readme.io/reference#testinput). This object contains an "authenticationCode" property with a string, with a reference code for the transaction that you will use to check its status later.

### Getting transfer status

Use the following method to retrieve a transaction's status. You will need to provide:

* The origin branch
* The origin account number
* The AuthenticationId (that you receive as `authenticationCode` from the `transfer` method)

```javascript
bankly.getTransferStatus('0001', '1234', 'AuthenticationId')
```

This method returns a promise that resolves to [a JSON object](https://bankly.readme.io/reference#testinput-1).

### Getting banks list

You can get a list of banks and payment institutions with respective codes from the Central Bank (Bacen). No authentication is needed. You can either call this getter from your instance:

```javascript
let banks = await bankly.bankList
```

Or use the static getter directly (no class instancing needed):

```javascript
let banks = await Bankly.bankList
```

This getter returns [a JSON array](https://bankly.readme.io/reference#banklist). You can also perform this request using your browser by [clicking here](https://api.bankly.com.br/baas/banklist).

### Debugging

You can define a function that receives debug logs (as strings) from your instance of the class.

```javascript
bankly.debug = console.log
```