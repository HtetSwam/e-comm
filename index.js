const express=require('express')
const cors=require('cors')
require('./DB/config')
const User=require('./DB/User')
const Product=require('./DB/Product')
const Jwt=require('jsonwebtoken')
const app=express()
const jwtKey='e-comm'

app.use(express.json())
app.use(cors())
app.post('/register',async(req,resp)=>{
   const user=new User(req.body)
   let result=await user.save()
   result=result.toObject()
   delete result.password
   if(result){
      Jwt.sign({result},jwtKey,{expiresIn:'2h'},(err,token)=>{
         if(err){
            resp.send({result:'something went wront, please try later.'})
         }
         resp.send({result,auth:token})
      })
   }
})
app.post('/login',async(req,resp)=>{
   if(req.body.email&&req.body.password){
      const user=await User.findOne(req.body).select('-password')
      if(user){
         Jwt.sign({user},jwtKey,{expiresIn:'2h'},(err,token)=>{
            if(err){
               resp.send({result:'something went wrong, please try later.'})
            }
            resp.send({user,auth:token})
         })
      }else{
         resp.send({result:'user not found'})
      }
   }else{
      resp.send({result:'must have two parameters'})
   }
})
app.post('/add-product',verifyToken,async(req,resp)=>{
   const product=new Product(req.body)
   let result=await product.save()
   resp.send(result)
})

app.get('/products',verifyToken,async(req,resp)=>{
   const products=await Product.find()
   if(products.length>0){
      resp.send(products)
   }else{
      resp.send('no products found')
   }
})

app.delete('/product/:id',verifyToken,async(req,resp)=>{
   const result=await Product.deleteOne({_id:req.params.id})
   resp.send(result);
})

app.get('/product/:id',verifyToken,async(req,resp)=>{
   let result=await Product.findOne({_id:req.params.id})
   if(result){
      resp.send(result) 
   }else{
      resp.send({result:'No Record Found.'})
   }
})

app.put('/product/:id',verifyToken,async(req,resp)=>{
   const result=await Product.updateOne(
      {_id:req.params.id},{$set:req.body}
      )
      if(result.acknowledged){
         resp.send(result)
      }else{
         resp.send({result:'fail to update'})
      }
})

app.get('/search/:key',verifyToken,async(req,resp)=>{
   let result=await Product.find({
      "$or":[
         {name:{$regex:req.params.key}},
         {company:{$regex:req.params.key}},
         {category:{$regex:req.params.key}}
      ]
   })
   resp.send(result)
})

function verifyToken(req,resp,next){
   let token=req.headers['authorization']
   if(token){
      token=token.split(' ')[1]
      Jwt.verify(token,jwtKey,(error,valid)=>{
         if(error){
            resp.status(401).send({result:'enter the valid authorization token'})
         }else{
            next()
         }
      })
   }else{
      resp.status(403).send({result:'enter the authoriation token'})
   }
}

app.listen(5000)