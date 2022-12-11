const { PATH_SYMBOLS, mock } = require("../dist/index");
const { RESPONSE } = PATH_SYMBOLS;


const ROUTES = {
    users: {
        [RESPONSE]: {
            template: [{
                id: "{{datatype.uuid}}:string",
                level: "[1|3|4|8|12]:number",
                name: "{{name.firstName}}:string",
                email: "{{internet.email}}:string",
                address: "{{address.streetAddress}}, {{address.state}}, {{address.zipCode}}:string",
                createdAt: "{{date.past}}:string",
            }],
        },
    }
}
mock(ROUTES)
