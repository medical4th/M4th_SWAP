const Token = artifacts.require("M4thToken");
const BN = web3.utils.BN;
const truffleAssert = require("truffle-assertions");
// web3.utils.toWei("100000000", "ether")

contract("M4 Token test", async accounts => {
    let m4token;
    let owner = accounts[0];
    let user1 = accounts[1];
    let user2 = accounts[2];
    let user3 = accounts[3];
    let user4 = accounts[4];
    let user5 = accounts[5];
    let user6 = accounts[6];
    let user7 = accounts[7];

    let _initSupply = new BN("4000000000000000000000000000"); //40억개
    let _name = "Medical4th";
    let _symbol = "M4th";
    let _decimals = 18;

    let toUser1Amount = new BN("1000000000000000000000000000"); //10억개
    let toUser2Amount = new BN("500000000000000000000000000"); //5억개
    let toUser3Amount = new BN("300000000000000000000"); //300개
    let toUser4Amount = new BN("1000000000000000000"); //1개    
    let toUser7Amount = new BN("1000000000000000000"); //1개    


    let burnUser1Amount = new BN("100000000000000000000000000"); //1억개
    let burnUser2Amount = new BN("10000000000000000000000000"); //1천만개
    let burnUser3Amount = new BN("100000000000000000000"); //300개
    let burnUser4Amount = new BN("100000000000000000"); //0.1개     

    before(async () => {
        m4token = await Token.deployed();
    });    

    describe("테스트 케이스 1 - ERC20 기본 정보 확인", ()=>{

        it("- 총 공급량이 맞는가?", async () => {
            let totalSupply = await m4token.totalSupply.call();
            assert.equal(new BN(totalSupply).toString(), _initSupply.toString(), "총 공급량 오류");
        });

        it("- 토큰 심볼이 맞는가?", async () => {
            let tmp = await m4token.symbol.call();
            assert.equal(tmp.valueOf(), _symbol, "심볼 오류");
        });

        it("- 토큰 이름이 맞는가?", async () => {
            let tmp = await m4token.name.call();
            assert.equal(tmp.valueOf(), _name, "이름 오류");
        });

        it("- 토큰 소수점 자릿수가 맞는가?", async () => {
            let tmp = await m4token.decimals.call();
            assert.equal(tmp.valueOf(), _decimals, "소숫점 자릿수 오류");
        });  
    });

    describe("테스트 케이스 2 - Ownable 체크", ()=>{

        it("- contract 생성자가 owner 인가?", async () => {
            let tmp = await m4token.owner.call();
            assert.equal(tmp.valueOf(), owner, "owner 오류");
        });
        it("- owner 변경이 되는가?", async () => {
            await m4token.transferOwnership(user2, {from : owner});
            let tmp = await m4token.owner.call();
            assert.equal(tmp.valueOf(), user2, "owner 변경 오류");
        });

        it("- 권한이 없는 경우 오류가 나는가?", async () => {
            await truffleAssert.fails(
              m4token.transferOwnership(user3, { from: owner }),
              truffleAssert.ErrorType.REVERT,
              "caller is not the owner"
            );
        });        
        it("- 다시 owner 변경이 되는가?", async () => {
            await m4token.transferOwnership(owner, { from: user2 });
            let tmp = await m4token.owner.call();
            assert.equal(tmp.valueOf(), owner, "owner 변경 오류");
        });        
    });    

    describe("테스트 케이스 3 - 토큰 전송 체크 및 수량체크", () => {

        it("- owner 수량이 총 발행량과 같은가?", async () => {
            let balance = await m4token.balanceOf(owner);
            assert.equal(new BN(balance).toString(), _initSupply.toString(), "owner 수량 오류");
        });        
        it("- user1 에게 토큰 전송 과 수량이 맞는가?", async () => {
            await m4token.transfer(user1, toUser1Amount);
            let ownerBalance = await m4token.balanceOf(owner);
            let balance = await m4token.balanceOf(user1);
            assert.equal(new BN(balance).toString(), toUser1Amount.toString(), "user1 수량 오류");
            assert.equal(new BN(ownerBalance).toString(), _initSupply.sub(toUser1Amount).toString(), "owner 수량 오류");
        });          
        
        it("- user2 에게 토큰 전송 과 수량이 맞는가?", async () => {
            await m4token.transfer(user2, toUser2Amount);
            let ownerBalance = await m4token.balanceOf(owner);
            let balance = await m4token.balanceOf(user2);
            assert.equal(new BN(balance).toString(), toUser2Amount.toString(), "user2 수량 오류");
            assert.equal(new BN(ownerBalance).toString(), 
                        _initSupply.sub(toUser1Amount).sub(toUser2Amount).toString(), "owner 수량 오류");
        });     
        
        it("- user3 에게 토큰 전송 과 수량이 맞는가?", async () => {
            await m4token.transfer(user3, toUser3Amount);
            let ownerBalance = await m4token.balanceOf(owner);
            let balance = await m4token.balanceOf(user3);
            assert.equal(new BN(balance).toString(), toUser3Amount.toString(), "user3 수량 오류");
            assert.equal(new BN(ownerBalance).toString(), 
                        _initSupply.sub(toUser1Amount).sub(toUser2Amount).sub(toUser3Amount).toString(), "owner 수량 오류");
        });
        
        it("- user4 에게 토큰 전송 과 수량이 맞는가?", async () => {
            await m4token.transfer(user4, toUser4Amount);
            let ownerBalance = await m4token.balanceOf(owner);
            let balance = await m4token.balanceOf(user4);
            assert.equal(new BN(balance).toString(), toUser4Amount.toString(), "user4 수량 오류");
            assert.equal(new BN(ownerBalance).toString(), 
                        _initSupply.sub(toUser1Amount).sub(toUser2Amount).sub(toUser3Amount).sub(toUser4Amount).toString(), "owner 수량 오류");
        });           
    });

    describe("테스트 케이스 4 - 토큰 소각 테스트", () => {

        it("- user1이 자신의 토큰을 소각 할수 있는가? 소각 후 수량 은 맞는가?", async () => {
            await m4token.burnToken(burnUser1Amount,{from:user1});
            let balance = await m4token.balanceOf(user1);
            assert.equal(new BN(balance).toString(), toUser1Amount.sub(burnUser1Amount).toString(), "user1 소각 수량 오류");
        });

        it("- user2가 자신의 토큰을 소각 할수 있는가? 소각 후 수량 은 맞는가?", async () => {
            await m4token.burnToken(burnUser2Amount,{from:user2});
            let balance = await m4token.balanceOf(user2);
            assert.equal(new BN(balance).toString(), toUser2Amount.sub(burnUser2Amount).toString(), "user2 소각 수량 오류");
        });        

        it("- user3가 자신의 토큰을 소각 할수 있는가? 소각 후 수량 은 맞는가?", async () => {
            await m4token.burnToken(burnUser3Amount,{from:user3});
            let balance = await m4token.balanceOf(user3);
            assert.equal(new BN(balance).toString(), toUser3Amount.sub(burnUser3Amount).toString(), "user3 소각 수량 오류");
        });         

        it("- user4가 자신의 토큰을 소각 할수 있는가? 소각 후 수량 은 맞는가?", async () => {
            await m4token.burnToken(burnUser4Amount,{from:user4});
            let balance = await m4token.balanceOf(user4);
            assert.equal(new BN(balance).toString(), toUser4Amount.sub(burnUser4Amount).toString(), "user4 소각 수량 오류");
        });      
        
        it("- 소각 후 총 발행량 수량 은 맞는가?", async () => {
            let totalSupply = await m4token.totalSupply.call();
            assert.equal(new BN(totalSupply).toString(), 
                _initSupply.sub(burnUser1Amount).sub(burnUser2Amount).sub(burnUser3Amount).sub(burnUser4Amount).toString(), "소각후 발행량 오류");
        });  
    });


    describe("테스트 케이스 5 - 제 3자 전송 테스트", () => {
        let approveAmount = new BN(web3.utils.toWei("100000000", "ether"));
        let increaseAmount = new BN(web3.utils.toWei("10000000", "ether"));
        let decreaseAmount = new BN(web3.utils.toWei("40000000", "ether"));
        let transFromAmount = new BN(web3.utils.toWei("20000000", "ether"));

        let user1FirstAmount;

        it("user1 이 user5에 1억개의 토큰을 위임", async () => {    
            user1FirstAmount = await m4token.balanceOf(user1);
            await m4token.approve(user5, approveAmount, {from : user1});
            let allowAmount = await m4token.allowance(user1, user5);
            assert.equal(new BN(allowAmount).toString(), approveAmount.toString(), "허가된 수량 오류");
        });

        it("user1 이 user5에 허용수량 추가하기", async () => {    
            await m4token.increaseAllowance(user5, increaseAmount, {from : user1});
            let allowAmount = await m4token.allowance(user1, user5);
            assert.equal(new BN(allowAmount).toString(), approveAmount.add(increaseAmount).toString(), "추가된 허가 수량 오류");
        });        

        it("user1 이 user5에 허용수량 축소하기", async () => {    
            await m4token.decreaseAllowance(user5, decreaseAmount, {from : user1});
            let allowAmount = await m4token.allowance(user1, user5);
            assert.equal(new BN(allowAmount).toString(), 
                approveAmount.add(increaseAmount).sub(decreaseAmount).toString(), "축소된 허가 수량 오류");
        });
        
        it("user1 로부터 위임된 토큰을 user5가 user6 에게 전송", async () => {    
            await m4token.transferFrom(user1, user6, transFromAmount, {from : user5});
            let user1Balance = await m4token.balanceOf(user1);
            let user6Balance = await m4token.balanceOf(user6);
            assert.equal(new BN(user1Balance).toString(), new BN(user1FirstAmount).sub(transFromAmount).toString(), "남은 수량 오류");
            assert.equal(new BN(user6Balance).toString(), transFromAmount.toString(), "받은 수량 오류");

            let allowAmount = await m4token.allowance(user1, user5);
            assert.equal(new BN(allowAmount).toString(), 
                approveAmount.add(increaseAmount).sub(decreaseAmount).sub(transFromAmount).toString(), "허가된 남은 수량 오류");
        });        

        it("위임된 토큰을 전송 후 남아 있는 위임 수량 확인", async () => {    
            let allowAmount = await m4token.allowance(user1, user5);
            assert.equal(new BN(allowAmount).toString(), 
                approveAmount.add(increaseAmount).sub(decreaseAmount).sub(transFromAmount).toString(), "허가된 남은 수량 오류");
        });          
    });    


    describe("테스트 케이스 6 - 전송 차단, 해제 테스트", () => {
        it("전송 차단 상태값이 false 인가?", async () => {
            let paused = await m4token.paused.call();
            assert.equal(paused, false, "해제 상태 오류");
        });

        it("전송 차단 상태로 변경 되는가?", async () => {
            await m4token.tokenPause();
            let paused = await m4token.paused.call();
            assert.equal(paused, true, "해제 상태 오류");

            await truffleAssert.fails(
              m4token.tokenPause(),
              truffleAssert.ErrorType.REVERT,
              "Pausable: paused"
            );
        });

        it("차단 상태에서 토큰 전송이 되는가?", async () => {
            await truffleAssert.fails(
              m4token.transfer(user1, toUser1Amount),
              truffleAssert.ErrorType.REVERT,
              "token transfer while paused"
            );         
        });

        it("차단 상태에서 제 3자 토큰 전송이 되는가?", async () => {
          await truffleAssert.fails(
            m4token.transferFrom(user1, user6, web3.utils.toWei("1", "ether"), {from : user5}),
            truffleAssert.ErrorType.REVERT,
            "token transfer while paused"
          );
        });

        it("전송 차단 해제가 되는가?", async () => {
            await m4token.tokenUnpause();
            let paused = await m4token.paused.call();
            assert.equal(paused, false, "해제 상태 오류");

            await truffleAssert.fails(
              m4token.tokenUnpause(),
              truffleAssert.ErrorType.REVERT,
              "Pausable: not paused"
            );
        });

        it("차단 해제 후 토큰 전송이 되는가?", async () => {
            await m4token.transfer(user7, toUser7Amount);
            let balance = await m4token.balanceOf(user7);
            assert.equal(new BN(balance).toString(), toUser7Amount.toString(), "user1 수량 오류");    
        });       

        it("차단 해제 후 제 3자 토큰 전송이 되는가?", async () => {
            await m4token.transferFrom(user1, user7, toUser7Amount, {from : user5});
            let user7Balance = await m4token.balanceOf(user7);
            assert.equal(new BN(user7Balance).toString(), toUser7Amount.add(toUser7Amount).toString(), "남은 수량 오류");
        });       
    });

    describe("테스트 케이스 7 - 권한 테스트", () => {
        it("일반 유저가 tokenPause 호출이 되는가?", async () => {
            await truffleAssert.fails(
              m4token.tokenPause({ from: user7 }),
              truffleAssert.ErrorType.REVERT,
              "Ownable: caller is not the owner"
            );            
        });
        it("일반 유저가 tokenUnpause 호출이 되는가?", async () => {
            await truffleAssert.fails(
              m4token.tokenUnpause({ from: user7 }),
              truffleAssert.ErrorType.REVERT,
              "Ownable: caller is not the owner"
            );            
        });     
        
        it("일반 유저가 transferOwnership 호출이 되는가?", async () => {
            await truffleAssert.fails(
              m4token.transferOwnership(user3, { from: user7 }),
              truffleAssert.ErrorType.REVERT,
              "caller is not the owner"
            );
        });          
    });
});