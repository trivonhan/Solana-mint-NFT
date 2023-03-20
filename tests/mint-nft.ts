import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { MintNft } from "../target/types/mint_nft";
import { SolanaConfigService } from '@coin98/solana-support-library/config'
import { TOKEN_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import * as ssl from "@coin98/solana-support-library"
import {
  Account,
  getMint, getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import { Connection, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { Metadata } from '@metaplex-foundation/mpl-token-metadata';

describe("mint-nft", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.MintNft as Program<MintNft>;

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  // Keypair and public key of master edition
  let root: anchor.web3.Keypair;
  let rootATA: anchor.web3.PublicKey;
  let mintKeypair: anchor.web3.Keypair;
  let metadataAddress: anchor.web3.PublicKey;
  let masterEditionAddress: anchor.web3.PublicKey;

  // Keypair and public key of edition
  let editionMintAddress: anchor.web3.Keypair;
  let recipientEditionOwner: anchor.web3.Keypair;
  let recipientATA: anchor.web3.PublicKey;
  let editionMetadataAddress: anchor.web3.PublicKey;
  let editionAddress: anchor.web3.PublicKey;
  let editionMarkPda: anchor.web3.PublicKey;
  let editionMarkBump: number;

  let recipientATAForMasterEdition: Account;

  // Delegate account
  let delegateAccount: anchor.web3.PublicKey;
  let delegateBump: number;


  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  before(async () => {
    root = await SolanaConfigService.getDefaultAccount();
    console.log(`Root: ${root.publicKey}`);

    mintKeypair = anchor.web3.Keypair.generate();
    rootATA = await anchor.utils.token.associatedAddress({
      mint: mintKeypair.publicKey,
      owner: root.publicKey
    });
    console.log(`New token (mint): ${mintKeypair.publicKey}`);
    console.log(`New token associated account: ${rootATA}`);
  })

  it('Create Mint account', async () => {
    const tx = await program.methods.createMintAccount().accounts({
      mint: mintKeypair.publicKey,
      mintAuthority: root.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([mintKeypair, root]).rpc();
    console.log(`Create mint account tx:`, tx);
  });

  it('Initialize Mint account', async () => {
    const tx = await program.methods.initializeMint().accounts({
      mint: mintKeypair.publicKey,
      mintAuthority: root.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([mintKeypair, root]).rpc();
    await new Promise(f => setTimeout(f, 100));
    console.log(`Initialize mint account tx:`, tx);
  });

  it('Create ATA', async () => {
    const tx = await program.methods.createAssociatedTokenAccount().accounts({
      payer: root.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ssl.ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
      mint: mintKeypair.publicKey,
      authority: root.publicKey,
      associatedToken: rootATA,
    }).signers([root, mintKeypair]).rpc();
    console.log(`Create ATA tx:`, tx);
    await new Promise(f => setTimeout(f, 100));

    const senderATA = await getOrCreateAssociatedTokenAccount(
      connection,
      root,
      mintKeypair.publicKey,
      root.publicKey
    );
    console.log('Sender ATA', senderATA.address.toBase58());
  });

  it('Mint token to ATA', async () => {
    const tx = await program.methods.mintToken(new anchor.BN(1)).accounts({
      mint: mintKeypair.publicKey,
      authority: root.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenAccount: rootATA,
      payer: root.publicKey,
    }).signers([mintKeypair, root]).rpc();
    console.log(`Mint token to ATA tx:`, tx);
    await new Promise(f => setTimeout(f, 100));

    const mintInfo = await getMint(connection, mintKeypair.publicKey);
    console.log(`Mint info:`, mintInfo);

    const senderATA = await getOrCreateAssociatedTokenAccount(
      connection,
      root,
      mintKeypair.publicKey,
      root.publicKey
    );
    console.log('Sender ATA', senderATA.amount);
  });

  it('Create metadata account', async () => {
    metadataAddress = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer()
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )[0];
    console.log(`Metadata address:`, metadataAddress.toBase58());



    const tx = await program.methods.createTokenMetadataAccount([
      {
        address: root.publicKey,
        verified: true,
        share: 100,
      }
    ], 
    "Hello I'm back",
    "HIB", 
    "https://raw.githubusercontent.com/Coding-and-Crypto/Solana-NFT-Marketplace/master/assets/example.json"
    ).accounts({
      metadataAccount: metadataAddress,
      mint: mintKeypair.publicKey,
      mintAuthority: root.publicKey,
      payer: root.publicKey,
      updateAuthority: root.publicKey,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    })
    .signers([root]).rpc()
    .catch(e => console.log(e));
  console.log(`Create metadata account tx:`, tx);
  });

  it('Create master edition account', async () => {
    masterEditionAddress = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
        Buffer.from('edition'),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    )[0];
    console.log(`Master edition address:`, masterEditionAddress.toBase58());
    const tx = await program.methods.createMasterEditionAccount(new anchor.BN(3)).accounts({
      masterEditionAccount: masterEditionAddress,
      mint: mintKeypair.publicKey,
      mintAuthority: root.publicKey,
      payer: root.publicKey,
      updateAuthority: root.publicKey,
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      metadataAccount: metadataAddress,
    }).signers([root]).rpc().catch(e => console.log(e));
    console.log(`Create metadata account tx:`, tx);
  });

  it('Get metadata address info', async () => {
    const metadataInfo = await Metadata.fromAccountAddress(connection, metadataAddress);
    console.log(`Metadata by owner:`, metadataInfo);
  });

  it('Create edition account', async () => {

    editionMintAddress = anchor.web3.Keypair.generate();
    console.log(`Edition mint address:`, editionMintAddress.publicKey.toBase58());
    recipientEditionOwner = anchor.web3.Keypair.generate();
    console.log(`Recipient edition owner:`, recipientEditionOwner.publicKey.toBase58());

    const airdropSignature = await connection.requestAirdrop(
      recipientEditionOwner.publicKey,
      LAMPORTS_PER_SOL,
    );
    
    await connection.confirmTransaction(airdropSignature);

    // Create mint of edition account and initialize
    const createMintAccountTx = await program.methods.createMintAccount().accounts({
      mint: editionMintAddress.publicKey,
      mintAuthority: recipientEditionOwner.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([recipientEditionOwner, editionMintAddress]).rpc().catch(e => console.log(e));
    console.log(`Create mint account tx:`, createMintAccountTx);

    const initializeMintTx = await program.methods.initializeMint().accounts({
      mint: editionMintAddress.publicKey,
      mintAuthority: recipientEditionOwner.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([recipientEditionOwner, editionMintAddress]).rpc();
    console.log(`Initialize mint tx:`, initializeMintTx);

    // Create ATA for recipient
    recipientATA = await anchor.utils.token.associatedAddress({
      mint: editionMintAddress.publicKey,
      owner: recipientEditionOwner.publicKey
    });

    const createATATx = await program.methods.createAssociatedTokenAccount().accounts({
      payer: root.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ssl.ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
      mint: editionMintAddress.publicKey,
      authority: recipientEditionOwner.publicKey,
      associatedToken: recipientATA,
    }).signers([root, editionMintAddress, recipientEditionOwner]).rpc();
    console.log(`Create ATA tx:`, createATATx);

    const recipientATAAmount = await getOrCreateAssociatedTokenAccount(
      connection,
      root,
      editionMintAddress.publicKey,
      recipientEditionOwner.publicKey
    );
    console.log('Recipient ATA', recipientATAAmount.amount);

    // Create edition account
    editionMetadataAddress = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from('metadata'),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          editionMintAddress.publicKey.toBuffer(),
        ], 
        TOKEN_METADATA_PROGRAM_ID,
      )[0];
    console.log(`Edition metadata address:`, editionMetadataAddress.toBase58());

    editionAddress = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        editionMintAddress.publicKey.toBuffer(),
        Buffer.from('edition'),
      ], 
      TOKEN_METADATA_PROGRAM_ID,
    )[0];
      console.log(`Edition address:`, editionAddress.toBase58());

    // Mint token 
    const mintTx = await program.methods.mintToken(new anchor.BN(1)).accounts({
      mint: editionMintAddress.publicKey,
      authority: recipientEditionOwner.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      tokenAccount: recipientATA,
      payer: root.publicKey,
    }).signers([editionMintAddress, root, recipientEditionOwner]).rpc();
    console.log(`Mint token to ATA tx:`, mintTx);

    const encoder = new TextEncoder();
    [editionMarkPda, editionMarkBump] = findProgramAddressSync([
        encoder.encode('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
        encoder.encode('edition'),
        encoder.encode(String(0)),
    ],
    TOKEN_METADATA_PROGRAM_ID
    )
    console.log(`Edition mark PDA:`, editionMarkPda.toBase58());

    const tx = await program.methods.createEditionAccount(new anchor.BN(1)).accounts({
      editionMetadataAccount: editionMetadataAddress,
      editionAccount: editionAddress,
      masterEditionAccount: masterEditionAddress,
      editionMint: editionMintAddress.publicKey,
      editionMarkPda: editionMarkPda,
      editionMintAuthority: recipientEditionOwner.publicKey,
      payer: root.publicKey,
      tokenAccountOwner: root.publicKey,
      tokenAccount: rootATA,
      editionUpdateAuthority: recipientEditionOwner.publicKey,
      metadataAccount: metadataAddress,
      metadataMint: mintKeypair.publicKey, // Mint of Master edition
      tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    }).signers([recipientEditionOwner, root])
    .rpc();
    console.log(`Create edition account tx:`, tx);
  });

  it("Delegate NFT to PDA", async () => {
    
    [delegateAccount, delegateBump] = findProgramAddressSync(
      [
        Buffer.from("delegate_nft"),
        Buffer.from("signer"),
      ],
      program.programId,
    );
    console.log(`Delegate account:`, delegateAccount.toBase58());
    const tx = await program.methods.delegateAccount(new anchor.BN(1)).accounts({
      sourceAccount: rootATA,
      delegateAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      signer: root.publicKey,
    }).signers([root]).rpc().catch(e => console.log(e));

    console.log(`Delegate NFT to PDA tx:`, tx);
  });

  it("PDA delegated transfer NFT to recipient", async () => {

    // Create ATA for recipient
    recipientATAForMasterEdition = await getOrCreateAssociatedTokenAccount(
      connection,
      recipientEditionOwner,
      mintKeypair.publicKey,
      recipientEditionOwner.publicKey
    );
    
    console.log(`Recipient ATA for master edition:`, recipientATAForMasterEdition.address.toBase58());

    const tx = await program.methods.transferFromDelegate(new anchor.BN(1),delegateBump).accounts({
      sourceAccount: rootATA,
      destinationAccount: recipientATAForMasterEdition.address,
      delegateAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
    }).signers([root]).rpc().catch(e => console.log(e));

    console.log(`PDA transfer NFT to recipient tx:`, tx);
  });

  // it('Burn edition', async () => {
  //   const tx = await program.methods.burnEditionNft().accounts({
  //     editionMetadataAccount: editionMetadataAddress,
  //     nftOwner: recipientEditionOwner.publicKey,
  //     editionMint: editionMintAddress.publicKey,
  //     masterEditionMint: mintKeypair.publicKey,
  //     editionTokenAccount: recipientATA,
  //     masterEditionTokenAccount: rootATA,
  //     masterEditionAccount: masterEditionAddress,
  //     editionAccount: editionAddress,
  //     editionMarkPda: editionMarkPda,
  //     tokenProgram: TOKEN_PROGRAM_ID,
  //     tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
  //   }).signers([recipientEditionOwner]).rpc().catch(e => console.log(e));
  //   console.log(`Burn edition tx:`, tx);
  // });

  // it('Burn master edition', async () => {
  //   const tx = await program.methods.burnMasterEditionNft().accounts({
  //     masterEditionMetadata: metadataAddress,
  //     masterEditionAccount: masterEditionAddress,
  //     masterEditionMint: mintKeypair.publicKey,
  //     masterEditionTokenAccount: rootATA,
  //     owner: root.publicKey,
  //     tokenProgram: TOKEN_PROGRAM_ID,
  //     tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
  //   }).signers([root]).rpc().catch(e => console.log(e));
  //   console.log(`Burn master edition tx:`, tx);
  // })

});
