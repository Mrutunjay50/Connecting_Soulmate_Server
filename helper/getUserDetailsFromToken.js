const jwt = require('jsonwebtoken')
const User = require('../models/Users')

const getUserDetailsFromToken = async (token)=>{
    try{
        if(!token){
            return {
                message : "session out",
                logout : true,
            }
        }
        const decode = jwt.verify(token, process.env.SECRET_KEY)
    
        const user = await User.findById(decode.id)
        return user
    }catch(err){
        console.log(err)
    }
}

module.exports = getUserDetailsFromToken