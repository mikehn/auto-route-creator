const { PATH_SYMBOLS, mock } = require("../dist/index");
const { RESPONSE, DYNAMIC, BIND } = PATH_SYMBOLS;
const UID = "uid";

const ROUTES = {
    units: {}, // API with no definition testing default response option for empty paths
    users: {
        [RESPONSE]: {
            template: [{
                id: "{{datatype.uuid}}:string",
                level: "[1|3|4|8|12]:number",
                name: "{{name.firstName}}:string",
                email: "{{internet.email}}:string",
                address: "{{address.streetAddress}}, {{address.state}}, {{address.zipCode}}:string",
                createdAt: "{{date.past}}:string",
                desc: "name:{{name.firstName}}:string",
                desc2: "use of : without type",
                desc3: "plain text"
            }],

            dynamicKeys: [BIND(UID, "id")],

            filter: (responseData, req) => {
                if (req?.query?.level)
                    return responseData.filter(({ level }) => level == req.query.level);
                return responseData;
            },
        },

        id: {
            [DYNAMIC]: UID,
            [RESPONSE]: {
                template: {
                    id: (url) => url.split("/").pop(),
                    ageGroup: "[20|30|40|50]:number",
                    heartRate: () => () => 60 + Math.trunc(Math.random() * 60)
                },
            }
        }
    }
}
mock(ROUTES, {
    port: 3008,
    defaultListSize: 2,
    defaultRes: (req, res) => {
        console.log("[defaultRes]: checking default for:", req.url);
        res.send("Default response");
    },
    //log: (level, ...msg) => console.log(`[${level}][${new Date()}]:`, ...msg),
    interceptor: (req, res, next, mockData) => {
        //console.log(mockData);
        console.log("[interceptor] got ", req.url);
        if (req.url == "/health") res.send("GOOD");
        else next();
    },
    onMockStart: () => { console.log("Mock started") },
    // https: { key, cert },
    //templateParser: (str, path) => path + "[" + Math.random() + "]" 
})


