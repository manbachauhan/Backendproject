const asyncHandler=(requestHandler)=>{  // for the utilities purpose a
    return ((req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=> next(err))
    })

}
export { asyncHandler }



// const asyncHandler=()={}
// const asyncHandler=(func)=> {()=>{} } higher order function
// const asyncHandler = (fn) => async () => { }

// const asyncHandler = (fn) => async (req,res,next)=> {
//     try{
//         await fn(req,res,next)
//     }
//     catch(error){
//          res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//          })
//     }
// }