import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadToCloudinary = async (filePath) => {
    try{
        if(!filePath){
            return null;
        }
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",
        })
        console.log("File uploaded successfully", response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(filePath); // Delete the file from local storage in case of error
        return null;  
    }
}

export { uploadToCloudinary };

// cloudinary.v2.uploader
//   .upload("/home/my_image.jpg",
//     { public_id: "my_image" },
//     function(error, result) {
//       console.log(result, error);
//     }
//   )
//   .then(result => console.log(result))
//   .catch(error => console.error(error));