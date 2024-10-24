
import { Router } from "express"

import { accountDAO } from "../DAO/database"
import getAuthController from "../../../general/controller/auth"

const router = Router()
const authController = getAuthController(accountDAO)

router.get("/signup", async (req, res) => {
    const [result, status] = await authController.signUp(req.body)
    res.status(status).json(result)
})

export default router
