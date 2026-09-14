import Express = require("express");

const app = Express();

app.use(Express.json());

app.get("/api", (req, res) => {
    res.json({
        message: "API Resgatando Almas funcionando!"
    });
});

app.listen(3001, () => {
    console.log("Backend rodando na porta 3001");
});