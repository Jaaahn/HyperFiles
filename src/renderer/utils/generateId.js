let crypto = require("crypto");

export default function generateId() {
    return crypto.randomBytes(8).toString("hex");
}
