const express = require('express')
const { Category } = require('../models/category')
const router = express.Router()
const {Product} = require('../models/products')
const mongoose = require('mongoose')
const multer = require('multer')

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype]
        let uploadError = new Error('Invalid image type')
        if(isValid){
            uploadError = null
        }
      cb(uploadError, 'public/uploads')
    },
    filename: function (req, file, cb) {
      const fileName = file.originalname.split(' ').join('-')
      const extension = FILE_TYPE_MAP[file.mimetype]
      cb(null, `${fileName}-${Date.now()}.${extension} `)
    }
  })
  
  const upload = multer({ storage: storage })

router.get('/' , async (req,res) =>{
    //localhost:3000/api/v1/products?categories=12345,7890
    let filter = {}
    if(req.query.categories){
        filter = {category: req.query.categories.split(',')}
    }
    const productList = await Product.find(filter).populate('category')
    if(!productList){
        res.status(500).json({
            success: false
        })
    }
    res.send(productList)
})

router.get('/:id' , async (req,res) =>{
    const product = await Product.findById(req.params.id).populate('category')
    if(!product){
        res.status(500).json({
            success: false
        })
    }
    res.send(product)
})

router.post('/' , upload.single('image') , async (req,res) =>{

    const category = await Category.findById(req.body.category)
    if(!category) 
    return res.status(404).send('Invalid Category')

    const file = req.file
    if(!file) 
    return res.status(404).send('No Image in the request')

    const fileName = req.file.filename
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`
    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        images: req.body.images,
        barnd: req.body.barnd,
        price: req.body.price,
        category: req.body.category,
        stock: req.body.stock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured
        
    })

    product = await product.save()
    if(!product) 
    return res.status(500).send('The Product Cant be ctreated')
    res.send(product)
    
})

router.put('/:id' , upload.single('image') ,async(req,res)=>{
    if(!mongoose.isValidObjectId(req.params.id)){
        res.status(400).send('Invalid Product Id')
    }
    const category = await Category.findById(req.body.category)
    if(!category) 
    return res.status(404).send('Invalid Category')

    const product = await Product.findById(req.body.category)
    if(!product) 
    return res.status(404).send('Invalid Product')

    const file = req.file
    let imagePath
    if(file){
        const fileNmae = file.filename
        const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`
        imagePath = `${basePath}${fileName}`
    }else{
        imagePath = product.image
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id , {
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: imagePath,
        images: req.body.images,
        barnd: req.body.barnd,
        price: req.body.price,
        category: req.body.category,
        stock: req.body.stock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured
    },
    {
        new: true
    }
    )
    if(!updatedProduct){
        res.status(500).json({message: 'The Product with give id is not found'})
    }
    res.status(200).send(updatedProduct)
})

router.delete('/:id' , (req , res) =>{
    Product.findByIdAndRemove(req.params.id)
    .then((product) =>{
        if(product){
            res.status(200).json({status: 'Success' , message: 'The Product was deleted Successfully'})
        }else{
            res.status(404).json({status: 'failed' , message: 'No Product was found'})
        }
    })
    .catch((err) =>{
        return res.status(400).json({status: 'failed', error: err})
    })
})

router.get('/get/count' , async (req,res) =>{
    const productCount = await Product.countDocuments()
    if(!productCount)
    res.status(400).json({status: false})
    res.send({
        TotalProducts: productCount
    })
})

router.get('/get/featured/:count' , async (req,res) =>{
    const count = req.params.count ? req.params.count : 0
    const products = await Product.find({isFeatured: true}).limit(+count)
    if(!products)
    res.status(400).json({status: false})
    res.send(products)
})

router.put('/gallery-images/:id' , upload.array('images' , 10) , async (req,res) =>{
    if(!mongoose.isValidObjectId(req.params.id)){
        res.status(400).send('Invalid Product Id')
    }
    const files = req.files
    const imagesPaths = []
    const basePath = `${req.protocol}://${req.get('host')}/public/uploads/`
    if(files){
        files.map((file) =>{
            imagesPaths.push(`${basePath}${file.filename}`)
        })
    }
    const product = await Product.findByIdAndUpdate(
        req.params.id ,
         {
        images: imagesPaths
         },
        {
        new: true
        }
    )
    if(!product){
        res.status(500).json({message: 'The Product with give id is not found'})
    }
    res.status(200).send(product)
})

module.exports = router