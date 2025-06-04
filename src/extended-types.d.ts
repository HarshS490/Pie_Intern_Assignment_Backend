interface AuthUser{
  id:string;
  username: string;
  avatarUrl?:body.image,
};


declare namespace Express{
  export interface Request{
    user?:AuthUser;
  }
}