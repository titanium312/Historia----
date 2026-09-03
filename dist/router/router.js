"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const GeneradorHs_1 = require("./Controller/GeneradorHs");
const buscar202_1 = require("./Controller/buscador/buscar202");
const buscarIdAdmision_1 = require("./Controller/buscador/buscarIdAdmision");
const dataregistro_1 = require("./Controller/miherramienta/dataregistro");
// ✅ CORREGIDO: Importar con default (sin llaves)
const subirdirecto_1 = __importDefault(require("./Controller/subirdirecto"));
const Buscardor_1 = require("./Controller/miherramienta/Buscardor");
const routerHistoria = (0, express_1.Router)();
routerHistoria.post('/GeneradorHs', GeneradorHs_1.GeneradorHs);
routerHistoria.post('/buscar', buscarIdAdmision_1.buscarAdmisionMiddleware);
routerHistoria.get('/buscar202', buscar202_1.buscar202);
routerHistoria.post('/subirdirecto', subirdirecto_1.default);
routerHistoria.post('/buscarAdmision', Buscardor_1.buscarAdmision);
routerHistoria.all('/historia', dataregistro_1.handleAll);
exports.default = routerHistoria;
