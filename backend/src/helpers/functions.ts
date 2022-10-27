import {NextFunction, Response, Request} from "express";
import jwt  from 'jsonwebtoken'
import {validationResult} from "express-validator";
import bcrypt from "bcrypt";
import UserSchema from "../models/User";

interface JwtPayload {
    _id: string
}



export const checkAuth =async (req:Request,res:Response,next:NextFunction )=>{
    const token = (req.headers.authorization || '').replace(/Bearer\s?/,'')

    if (token){
        try{
            const decoded = jwt.verify(token,'key123') as JwtPayload
            req.user = {_id: decoded._id}
            next()
        }catch (err){
            return res.status(400).json({
                message:'No Access'
            })
        }
    } else{
        return res.status(400).json({
            message:'No Access'
        })
    }
}

export const register = async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({errors: errors.array()});
            }
            // salt and hash password https://heynode.com/blog/2020-04/salt-and-hash-passwords-bcrypt/
            const password = req.body.password
            const salt = await bcrypt.genSalt(10)
            const hash = await bcrypt.hash(password, salt)

            const doc = new UserSchema({
                email: req.body.email,
                passwordHash :hash,
                fullName: req.body.fullName,
                avatarUrl: req.body.avatarUrl
            })

            const user = await doc.save()

            const token = jwt.sign(
                {
                    _id: user._id
                },
                'key123',
                {
                    expiresIn: '60d'
                })
            const {passwordHash,...userData } =user._doc
            res.json({...userData, token})
        } catch (err) {
            console.log(err)
            res.status(500).json({
                message: 'Not able to register'
            })
        }
    }
export const login = async (req:Request,res:Response)=>{
    try{
        const user = await UserSchema.findOne({email: req.body.email})
        if(!user){
            return res.status(404).json({
                message: 'User not found'
            })
        }

        const isValidPass = await bcrypt.compare(req.body.password,user.passwordHash)
        if(!isValidPass){
            return res.status(400).json({
                message: 'Login or password is incorrect'
            })
        }

        const token = jwt.sign(
            {
                _id: user._id
            },
            'key123',
            {
                expiresIn: '60d'
            })
        const {passwordHash,...userData } =user._doc
        res.json({...userData, token})
    }catch (err){
        console.log(err)
        res.status(500).json({
            message: 'Not able to sing in'})
    }
}

export const checkAuthorisation = async (req:Request,res:Response)=>{

    try {
        const user = await UserSchema.findById(req.user)
        if(!user){
            return res.status(400).json({
                message:'Not found'
            })
        }
        const {passwordHash,...userData } =user._doc
        res.json({userData})
    }catch (err){
        console.log(err)
        res.status(500).json({
            message:'No access'
        })
    }
}