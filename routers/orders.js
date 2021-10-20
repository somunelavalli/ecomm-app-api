const {Order} = require('../models/order');
const {OrderItem} = require('../models/order-item')
const express = require('express');
const router = express.Router();

router.get(`/`, async (req, res) =>{
    const orderList = await Order.find().populate('user' , 'name email phone').sort({'dateOrdered': -1})

    if(!orderList) {
        res.status(500).json({success: false})
    } 
    res.send(orderList);
})

router.get(`/:id`, async (req, res) =>{
    const order = await Order.findById(req.params.id)
    .populate('user' , 'name email phone')
    .populate({path: 'orderItems' , populate: 'product'})

    if(!order) {
        res.status(500).json({success: false})
    } 
    res.send(order);
})

router.post('/' , async (req,res) =>{
    const orderItemsIds = Promise.all(req.body.orderItems.map(async (orderItem) => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })
        newOrderItem = await newOrderItem.save()
        return newOrderItem._id
    }))
    const orderItemsIdsResolved = await orderItemsIds
    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async (orderItemId)=>{
        const orderItem = await OrderItem.findById(orderItemId).populate('product' , 'price')
        const totalPrice = orderItem.product.price * orderItem.quantity
        return totalPrice
    }))
    // console.log(totalPrices)
    const totalPrice = totalPrices.reduce((a,b) => a + b ,0)
    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user
    })
    order = await order.save()
    if(!order)
    return res.status(404).send('The order Cant be Created')
    res.send(order)
})

router.put('/:id' , async(req,res)=>{
    const order = await Order.findByIdAndUpdate(req.params.id , {
        status: req.body.status
    },
    {
        new: true
    }
    )
    if(!order){
        res.status(500).json({message: 'The Order with give id is not found'})
    }
    res.status(200).send(order)
})

router.delete('/:id' , (req , res) =>{
    Order.findByIdAndRemove(req.params.id)
    .then(async (order) =>{
        if(order){
            await order.orderItems.map(async (orderItem) =>{
                await OrderItem.findByIdAndRemove(orderItem)
            })
            res.status(200).json({status: 'Success' , message: 'The Order was deleted Successfully'})
        }else{
            res.status(404).json({status: 'failed' , message: 'No Order was found'})
        }
    })
    .catch((err) =>{
        return res.status(400).json({status: 'failed', error: err})
    })
})

router.get('/get/totalsales' , async (req,res) =>{
    const totalSales = await Order.aggregate([
        {$group: {_id: null , totalsales: {$sum: '$totalPrice'}}}
    ])
    if(!totalSales){
        return res.status(400).send('The Total Order Sales Cant be generated')
    }
    res.send({TotalSales: totalSales.pop().totalsales})
})

router.get('/get/count' , async (req,res) =>{
    const orderCount = await Order.countDocuments()
    if(!orderCount)
    res.status(400).json({status: false})
    res.send({
        TotalOrders: orderCount
    })
})

router.get(`/get/userorders/:userid`, async (req, res) =>{
    const userOrderList = await Order.find({user: req.params.userid})
    .populate({path: 'orderItems' , populate:{path: 'product' , populate: 'category'}})
    .sort({'dateOrdered': -1})

    if(!userOrderList) {
        res.status(500).json({success: false})
    } 
    res.send(userOrderList);
})



module.exports =router;